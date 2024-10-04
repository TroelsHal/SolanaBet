import React, { useState, useEffect } from "react";
import { GameToCreate } from "../types";
import { Button, Form } from "react-bootstrap";
import { tournaments } from "../data/tournamentsData";
import { parse, isValid } from "date-fns";

interface CreateGameFormProps {
  onSubmit: (formData: GameToCreate, resetForm: () => void) => void;
}

const CreateGameForm: React.FC<CreateGameFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<GameToCreate>({
    homeTeam: "",
    awayTeam: "",
    tournament: "",
    bettingEnds: 0, // Unix timestamp in seconds
  });

  const [startDate, setStartDate] = useState<string>("");
  const [startTime, setStartTime] = useState<string>("");
  const [localTime, setLocalTime] = useState<string>("");

  const [selectedTournament, setSelectedTournament] = useState<string>("");
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);

  const resetForm = () => {
    setFormData({
      homeTeam: "",
      awayTeam: "",
      tournament: "",
      bettingEnds: 0,
    });
    setStartDate("");
    setStartTime("");
    setSelectedTournament("");
    setAvailableTeams([]);
    setLocalTime("");
  };

  const handleTournamentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tournament = e.target.value;
    const [, teams] = tournaments[tournament] || ["", []];
    setSelectedTournament(tournament);
    setAvailableTeams(teams);
    setFormData({ ...formData, tournament, homeTeam: "", awayTeam: "" });
  };

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let dateInput = e.target.value.replace(/\D/g, "");

    if (dateInput.length > 2) {
      dateInput = dateInput.slice(0, 2) + "/" + dateInput.slice(2);
    }
    if (dateInput.length > 5) {
      dateInput = dateInput.slice(0, 5) + "/" + dateInput.slice(5);
    }

    if (dateInput.length > 10) {
      dateInput = dateInput.slice(0, 10);
    }

    setStartDate(dateInput);
  };

  // Handle time input change (in HH:MM format)
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setStartTime(e.target.value);
  };

  // Parse DD/MM/YYYY to create a Date object in UTC
  const parseDate = (dateString: string, timeString: string) => {
    const [day, month, year] = dateString.split("/").map(Number);
    const [hours, minutes] = timeString.split(":").map(Number);

    // Create a Date object in UTC
    const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    return date;
  };

  // Update local time display, using the browser's settings for 12/24 hour format
  useEffect(() => {
    if (startDate && startTime) {
      try {
        const bettingEndsDateTime = parseDate(startDate, startTime);
        const localTimeString = bettingEndsDateTime.toLocaleTimeString(
          undefined,
          {
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          }
        );
        setLocalTime(localTimeString);
      } catch (error) {
        setLocalTime("");
      }
    } else {
      setLocalTime("");
    }
  }, [startDate, startTime]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!startDate || !startTime) {
      alert("Please select a valid date and time.");
      return;
    }

    const parsedDate = parse(startDate, "dd/MM/yyyy", new Date());
    if (!isValid(parsedDate)) {
      alert("Invalid date! Please enter a valid date in DD/MM/YYYY format.");
      return;
    }

    try {
      // Parse the date and time into a Unix timestamp
      const bettingEndsDateTime = parseDate(startDate, startTime);

      // Pass the updated form data with the converted timestamp
      onSubmit(
        {
          ...formData,
          bettingEnds: bettingEndsDateTime.getTime(),
        },
        resetForm
      );
    } catch (error) {
      alert(
        "Invalid date or time. Please ensure the date is in DD/MM/YYYY format."
      );
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group className="mb-3">
        <Form.Label>Tournament:</Form.Label>
        <Form.Select
          value={selectedTournament}
          onChange={handleTournamentChange}
          required
        >
          <option value="">Select a Tournament</option>
          {Object.keys(tournaments).map((tournament) => (
            <option key={tournament} value={tournament}>
              {tournament}
            </option>
          ))}
        </Form.Select>
      </Form.Group>

      {selectedTournament && (
        <>
          <Form.Group className="mb-3">
            <Form.Label>Home Team</Form.Label>
            <Form.Select
              name="homeTeam"
              value={formData.homeTeam}
              onChange={handleTeamChange}
              required
            >
              <option value="">Select Home Team</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Away Team</Form.Label>
            <Form.Select
              name="awayTeam"
              value={formData.awayTeam}
              onChange={handleTeamChange}
              required
            >
              <option value="">Select Away Team</option>
              {availableTeams.map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
        </>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Game Start Date (DD/MM/YYYY)</Form.Label>
        <Form.Control
          type="text"
          value={startDate}
          onChange={handleDateChange}
          placeholder="DD/MM/YYYY"
          pattern="\d{2}/\d{2}/\d{4}"
          required
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Game Start Time (UTC)</Form.Label>
        <Form.Control
          type="time"
          value={startTime}
          onChange={handleTimeChange}
          step="60"
          required
        />
      </Form.Group>

      {localTime && (
        <Form.Text className="text-muted mb-3">
          Local time equivalent: {localTime}
        </Form.Text>
      )}

      <div className="mt-3">
        <Button variant="primary" type="submit">
          Create New Game
        </Button>
      </div>
    </Form>
  );
};

export default CreateGameForm;
