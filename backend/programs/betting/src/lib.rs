use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

declare_id!("63p9553Ch7gsrAZM1NKq2AYvjybBCZZdpSvynGzUdziC");

#[program]
pub mod betting {

    use super::*;

    // set to 1 minute on development branch
    // set to 6 month on main branch
    pub const EXPIRATION_TIME_SECONDS: i64 = 60;

    pub fn initialize_program(ctx: Context<InitializeProgram>, manager: Pubkey) -> Result<()> {
        let program_settings = &mut ctx.accounts.program_settings;
        program_settings.manager = manager;
        Ok(())
    }

    pub fn initialize_game(
        ctx: Context<InitializeGame>,
        home: String,
        away: String,
        tournament: String,
        start_time: i64,
    ) -> Result<()> {
        require!(
            start_time > Clock::get()?.unix_timestamp,
            ErrorCode::InvalidTime
        );

        let game_account = &mut ctx.accounts.game_account;
        game_account.home_team = home;
        game_account.away_team = away;
        game_account.tournament = tournament;
        game_account.total_amount_draw = 0;
        game_account.total_amount_home = 0;
        game_account.total_amount_away = 0;
        game_account.result = 255;
        game_account.start_time = start_time;
        game_account.result_declared_time = 0;
        Ok(())
    }

    pub fn close_game(ctx: Context<CloseGame>) -> Result<()> {
        require!(
            ctx.accounts.game_account.result != 255
                && Clock::get()?.unix_timestamp
                    > ctx.accounts.game_account.result_declared_time + EXPIRATION_TIME_SECONDS,
            ErrorCode::GameNotExpired
        );
        Ok(())
    }

    pub fn transfer_manager(ctx: Context<TransferManager>, new_manager: Pubkey) -> Result<()> {
        ctx.accounts.program_settings.manager = new_manager;
        Ok(())
    }

    pub fn declare_result(ctx: Context<DeclareResult>, result: u8) -> Result<()> {
        require!(result <= 2 || result == 6, ErrorCode::InvalidResult);

        require!(
            Clock::get()?.unix_timestamp > ctx.accounts.game_account.start_time,
            ErrorCode::BettingPeriodStillOpen
        );

        require!(
            ctx.accounts.game_account.result == 255,
            ErrorCode::ResultAlreadyDeclared
        );

        // If nobody bet on correct result, set result to result+3
        if (result == 0 && ctx.accounts.game_account.total_amount_draw == 0)
            || (result == 1 && ctx.accounts.game_account.total_amount_home == 0)
            || (result == 2 && ctx.accounts.game_account.total_amount_away == 0)
        {
            ctx.accounts.game_account.result = result + 3;
        } else {
            ctx.accounts.game_account.result = result;
        }

        ctx.accounts.game_account.result_declared_time = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn make_bet(ctx: Context<MakeBet>, prediction: u8, amount: u64) -> Result<()> {
        require!(
            ctx.accounts.user.lamports() >= amount,
            ErrorCode::InsufficientFunds
        );

        require!(
            Clock::get()?.unix_timestamp < ctx.accounts.game_account.start_time,
            ErrorCode::BettingPeriodEnded
        );

        require!(amount > 0, ErrorCode::BetIsZero);

        require!(prediction <= 2, ErrorCode::InvalidPrediction);

        match prediction {
            0 => ctx.accounts.game_account.total_amount_draw += amount,
            1 => ctx.accounts.game_account.total_amount_home += amount,
            2 => ctx.accounts.game_account.total_amount_away += amount,
            _ => return Err(ErrorCode::InvalidPrediction.into()),
        }

        let total_sum = ctx.accounts.game_account.total_amount_draw
            + ctx.accounts.game_account.total_amount_home
            + ctx.accounts.game_account.total_amount_away;

        require!(
            total_sum <= 100_000_000_000_000,
            ErrorCode::ExceedsMaximumAllowedAmount
        );

        let from_pubkey = ctx.accounts.user.to_account_info();
        let to_pubkey = ctx.accounts.game_account.to_account_info();
        let program_id = ctx.accounts.system_program.to_account_info();

        let cpi_context = CpiContext::new(
            program_id,
            Transfer {
                from: from_pubkey,
                to: to_pubkey,
            },
        );
        // returns Err if the transfer fails
        transfer(cpi_context, amount)?;

        ctx.accounts.bet_account.amount += amount;

        // These values are only written if a value is changed
        ctx.accounts.bet_account.game = ctx.accounts.game_account.key();
        ctx.accounts.bet_account.bump = ctx.bumps.bet_account;
        ctx.accounts.bet_account.user = ctx.accounts.user.key();
        ctx.accounts.bet_account.prediction = prediction;
        Ok(())
    }

    pub fn claim_winnings(ctx: Context<ClaimWinnings>, prediction: u8) -> Result<()> {
        require!(
            ctx.accounts.game_account.result <= 6,
            ErrorCode::ResultNotDeclared
        );

        if ctx.accounts.game_account.result == prediction
            || (ctx.accounts.game_account.result >= 3 && ctx.accounts.game_account.result <= 6)
        {
            let from_pubkey = ctx.accounts.game_account.to_account_info();
            let to_pubkey = ctx.accounts.user.to_account_info();

            let winning_amount;

            if ctx.accounts.game_account.result >= 3 && ctx.accounts.game_account.result <= 6 {
                winning_amount = ctx.accounts.bet_account.amount;
            } else {
                let total_winning_bets;
                match prediction {
                    0 => total_winning_bets = ctx.accounts.game_account.total_amount_draw,
                    1 => total_winning_bets = ctx.accounts.game_account.total_amount_home,
                    2 => total_winning_bets = ctx.accounts.game_account.total_amount_away,
                    _ => return Err(ErrorCode::InvalidPrediction.into()),
                }

                let total_bets = ctx.accounts.game_account.total_amount_draw
                    + ctx.accounts.game_account.total_amount_home
                    + ctx.accounts.game_account.total_amount_away;

                winning_amount = (ctx.accounts.bet_account.amount as u128)
                    .checked_mul(total_bets as u128)
                    .and_then(|v| v.checked_mul(99))
                    .and_then(|v| v.checked_div(total_winning_bets as u128))
                    .and_then(|v| v.checked_div(100))
                    .ok_or(ErrorCode::CalculationError)? as u64;
            }

            **from_pubkey.try_borrow_mut_lamports()? -= winning_amount;
            **to_pubkey.try_borrow_mut_lamports()? += winning_amount;
        }

        Ok(())
    }

    pub fn close_bet_account(ctx: Context<CloseBetAccount>, _prediction: u8) -> Result<()> {
        let game_account_info = &ctx.accounts.game_account;

        if game_account_info.owner == &System::id() && game_account_info.data_is_empty() {
            Ok(())
        } else {
            return Err(ErrorCode::GameNotClosed.into());
        }
    }
}

#[account]
pub struct ProgramSettings {
    pub manager: Pubkey,
}

#[account]
pub struct Game {
    pub home_team: String,
    pub away_team: String,
    pub tournament: String,
    pub total_amount_draw: u64,
    pub total_amount_home: u64,
    pub total_amount_away: u64,
    // 0: draw, 1: home, 2: away,
    // 3: draw but no winning players, 4: home but no winning players,
    // 5: away but no winning players,
    // 6: cancelled:
    // 255: result not yet declared
    pub result: u8,
    pub start_time: i64,
    pub result_declared_time: i64,
}

#[account]
pub struct Bet {
    pub amount: u64,
    pub bump: u8,
    pub user: Pubkey,
    pub game: Pubkey,
    pub prediction: u8,
}

// **Accounts Context Structs**
// These structs define the structure and constraints of the accounts
// that a particular instruction within the program will interact with.

#[derive(Accounts)]
pub struct InitializeProgram<'info> {
    #[account(
        init,
        seeds = [b"settings".as_ref()],
        bump,
        payer = user,
        space = 8 + 32,
    )]
    pub program_settings: Account<'info, ProgramSettings>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferManager<'info> {
    #[account(mut, has_one = manager)]
    pub program_settings: Account<'info, ProgramSettings>,
    pub manager: Signer<'info>,
}

#[derive(Accounts)]
pub struct InitializeGame<'info> {
    // space is 8 bytes for the account discriminator,
    // 4 bytes (overhead) for each String
    // 48 bytes for the Strings themselves (in total max 48 chars)
    // 3 * 8 bytes for the u64 total_amounts
    // 1 byte for the u8 result
    // 8 bytes for the i64 start_time
    // 8 bytes for the i64 result_declared_time
    #[account(init, payer = manager, space = 8 + 4 + 4 + 4 + 48 + 8 + 8 + 8 + 1 + 8 + 8)]
    pub game_account: Account<'info, Game>,
    #[account(
        seeds = [b"settings".as_ref()],
        bump,
        has_one = manager @ ErrorCode::UnauthorizedManager,
    )]
    pub program_settings: Account<'info, ProgramSettings>,
    #[account(mut)]
    pub manager: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(prediction: u8)]
pub struct CloseBetAccount<'info> {
    #[account(
        mut,
        seeds = [user.key().as_ref(), game_account.key.as_ref(), &prediction.to_le_bytes()],
        bump,
        close = user
    )]
    pub bet_account: Account<'info, Bet>,
    #[account(mut)]
    pub user: Signer<'info>,
    /// CHECK: Game account no longer exists, but is used as seed.
    pub game_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CloseGame<'info> {
    #[account(mut, close = manager)]
    pub game_account: Account<'info, Game>,
    #[account(has_one = manager)]
    pub program_settings: Account<'info, ProgramSettings>,
    #[account(mut)]
    pub manager: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(prediction: u8)]
pub struct MakeBet<'info> {
    // space: 8 bytes account discriminator,
    // 8 bytes amount,
    // 1 byte bump,
    // 32 bytes for the user pubkey.
    // 32 bytes for the game pubkey.
    // 1 byte for the prediction.
    // The result u8, is converted to bytes.
    // The empty bump constraint means that anchor should find the canonical bump itself.
    #[account(init_if_needed, payer = user, space = 8 + 8 + 1 + 32 + 32 + 1,
        seeds = [user.key().as_ref(), game_account.key().as_ref(), &prediction.to_le_bytes()], bump)]
    pub bet_account: Account<'info, Bet>,
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub game_account: Account<'info, Game>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(prediction: u8)]
pub struct ClaimWinnings<'info> {
    #[account(
        mut,
        seeds = [user.key().as_ref(), game_account.key().as_ref(), &prediction.to_le_bytes()],
        bump,
        close = user
        )]
    pub bet_account: Account<'info, Bet>,
    #[account(mut)]
    pub game_account: Account<'info, Game>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeclareResult<'info> {
    #[account(
        seeds = [b"settings".as_ref()],
        bump,
        has_one = manager @ ErrorCode::UnauthorizedManager,
    )]
    pub program_settings: Account<'info, ProgramSettings>,
    #[account(mut)]
    pub game_account: Account<'info, Game>,
    pub manager: Signer<'info>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient funds")]
    InsufficientFunds,

    #[msg("Invalid prediction value")]
    InvalidPrediction,

    #[msg("Betting period ended")]
    BettingPeriodEnded,

    #[msg("Result not declared")]
    ResultNotDeclared,

    #[msg("Invalid time")]
    InvalidTime,

    #[msg("Unauthorized manager")]
    UnauthorizedManager,

    #[msg("Invalid result")]
    InvalidResult,

    #[msg("Calculation error")]
    CalculationError,

    #[msg("Exceeds maximum allowed amount")]
    ExceedsMaximumAllowedAmount,

    #[msg("Bet must be positive number")]
    BetIsZero,

    #[msg("Result already declared")]
    ResultAlreadyDeclared,

    #[msg("Betting period still open")]
    BettingPeriodStillOpen,

    #[msg("Game not expired")]
    GameNotExpired,

    #[msg("Game not closed")]
    GameNotClosed,
}
