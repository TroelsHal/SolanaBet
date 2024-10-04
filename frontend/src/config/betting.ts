/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/betting.json`.
 */
export type Betting = {
  address: "6HbAz3WNYGDe2B5wC3WNfYjLZFVHMdw1t3RpiRPAJFRx";
  metadata: {
    name: "betting";
    version: "0.1.0";
    spec: "0.1.0";
    description: "Created with Anchor";
  };
  instructions: [
    {
      name: "claimWinnings";
      discriminator: [161, 215, 24, 59, 14, 236, 242, 221];
      accounts: [
        {
          name: "betAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "user";
              },
              {
                kind: "account";
                path: "gameAccount";
              },
              {
                kind: "arg";
                path: "prediction";
              }
            ];
          };
        },
        {
          name: "gameAccount";
          writable: true;
        },
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "prediction";
          type: "u8";
        }
      ];
    },
    {
      name: "closeBetAccount";
      discriminator: [46, 209, 107, 217, 227, 100, 211, 211];
      accounts: [
        {
          name: "betAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "user";
              },
              {
                kind: "account";
                path: "gameAccount";
              },
              {
                kind: "arg";
                path: "prediction";
              }
            ];
          };
        },
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "gameAccount";
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "prediction";
          type: "u8";
        }
      ];
    },
    {
      name: "closeGame";
      discriminator: [237, 236, 157, 201, 253, 20, 248, 67];
      accounts: [
        {
          name: "gameAccount";
          writable: true;
        },
        {
          name: "programSettings";
        },
        {
          name: "manager";
          writable: true;
          signer: true;
          relations: ["programSettings"];
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [];
    },
    {
      name: "declareResult";
      discriminator: [205, 129, 155, 217, 131, 167, 175, 38];
      accounts: [
        {
          name: "programSettings";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 101, 116, 116, 105, 110, 103, 115];
              }
            ];
          };
        },
        {
          name: "gameAccount";
          writable: true;
        },
        {
          name: "manager";
          signer: true;
          relations: ["programSettings"];
        }
      ];
      args: [
        {
          name: "result";
          type: "u8";
        }
      ];
    },
    {
      name: "initializeGame";
      discriminator: [44, 62, 102, 247, 126, 208, 130, 215];
      accounts: [
        {
          name: "gameAccount";
          writable: true;
          signer: true;
        },
        {
          name: "programSettings";
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 101, 116, 116, 105, 110, 103, 115];
              }
            ];
          };
        },
        {
          name: "manager";
          writable: true;
          signer: true;
          relations: ["programSettings"];
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "home";
          type: "string";
        },
        {
          name: "away";
          type: "string";
        },
        {
          name: "tournament";
          type: "string";
        },
        {
          name: "startTime";
          type: "i64";
        }
      ];
    },
    {
      name: "initializeProgram";
      discriminator: [176, 107, 205, 168, 24, 157, 175, 103];
      accounts: [
        {
          name: "programSettings";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "const";
                value: [115, 101, 116, 116, 105, 110, 103, 115];
              }
            ];
          };
        },
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "manager";
          type: "pubkey";
        }
      ];
    },
    {
      name: "makeBet";
      discriminator: [133, 244, 84, 216, 179, 96, 110, 149];
      accounts: [
        {
          name: "betAccount";
          writable: true;
          pda: {
            seeds: [
              {
                kind: "account";
                path: "user";
              },
              {
                kind: "account";
                path: "gameAccount";
              },
              {
                kind: "arg";
                path: "prediction";
              }
            ];
          };
        },
        {
          name: "user";
          writable: true;
          signer: true;
        },
        {
          name: "gameAccount";
          writable: true;
        },
        {
          name: "systemProgram";
          address: "11111111111111111111111111111111";
        }
      ];
      args: [
        {
          name: "prediction";
          type: "u8";
        },
        {
          name: "amount";
          type: "u64";
        }
      ];
    },
    {
      name: "transferManager";
      discriminator: [183, 122, 218, 241, 4, 151, 156, 120];
      accounts: [
        {
          name: "programSettings";
          writable: true;
        },
        {
          name: "manager";
          signer: true;
          relations: ["programSettings"];
        }
      ];
      args: [
        {
          name: "newManager";
          type: "pubkey";
        }
      ];
    }
  ];
  accounts: [
    {
      name: "bet";
      discriminator: [147, 23, 35, 59, 15, 75, 155, 32];
    },
    {
      name: "game";
      discriminator: [27, 90, 166, 125, 74, 100, 121, 18];
    },
    {
      name: "programSettings";
      discriminator: [37, 198, 237, 228, 196, 117, 226, 9];
    }
  ];
  errors: [
    {
      code: 6000;
      name: "insufficientFunds";
      msg: "Insufficient funds";
    },
    {
      code: 6001;
      name: "invalidPrediction";
      msg: "Invalid prediction value";
    },
    {
      code: 6002;
      name: "bettingPeriodEnded";
      msg: "Betting period ended";
    },
    {
      code: 6003;
      name: "resultNotDeclared";
      msg: "Result not declared";
    },
    {
      code: 6004;
      name: "invalidTime";
      msg: "Invalid time";
    },
    {
      code: 6005;
      name: "unauthorizedManager";
      msg: "Unauthorized manager";
    },
    {
      code: 6006;
      name: "invalidResult";
      msg: "Invalid result";
    },
    {
      code: 6007;
      name: "calculationError";
      msg: "Calculation error";
    },
    {
      code: 6008;
      name: "exceedsMaximumAllowedAmount";
      msg: "Exceeds maximum allowed amount";
    },
    {
      code: 6009;
      name: "betIsZero";
      msg: "Bet must be positive number";
    },
    {
      code: 6010;
      name: "resultAlreadyDeclared";
      msg: "Result already declared";
    },
    {
      code: 6011;
      name: "bettingPeriodStillOpen";
      msg: "Betting period still open";
    },
    {
      code: 6012;
      name: "gameNotExpired";
      msg: "Game not expired";
    },
    {
      code: 6013;
      name: "gameNotClosed";
      msg: "Game not closed";
    }
  ];
  types: [
    {
      name: "bet";
      type: {
        kind: "struct";
        fields: [
          {
            name: "amount";
            type: "u64";
          },
          {
            name: "bump";
            type: "u8";
          },
          {
            name: "user";
            type: "pubkey";
          },
          {
            name: "game";
            type: "pubkey";
          },
          {
            name: "prediction";
            type: "u8";
          }
        ];
      };
    },
    {
      name: "game";
      type: {
        kind: "struct";
        fields: [
          {
            name: "homeTeam";
            type: "string";
          },
          {
            name: "awayTeam";
            type: "string";
          },
          {
            name: "tournament";
            type: "string";
          },
          {
            name: "totalAmountDraw";
            type: "u64";
          },
          {
            name: "totalAmountHome";
            type: "u64";
          },
          {
            name: "totalAmountAway";
            type: "u64";
          },
          {
            name: "result";
            type: "u8";
          },
          {
            name: "startTime";
            type: "i64";
          },
          {
            name: "resultDeclaredTime";
            type: "i64";
          }
        ];
      };
    },
    {
      name: "programSettings";
      type: {
        kind: "struct";
        fields: [
          {
            name: "manager";
            type: "pubkey";
          }
        ];
      };
    }
  ];
};
