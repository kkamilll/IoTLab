import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axios from "axios";
import Users from "../src/components/Users.jsx";

jest.mock("axios");

const mockUsers = [
  { _id: "1", name: "Alice", email: "alice@example.com", role: "admin", isActive: true, labRooms: ["Lab1"] },
  { _id: "2", name: "Bob", email: "bob@example.com", role: "lecturer", isActive: false, labRooms: ["Lab2"] }
];

describe("Users Component", () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: { users: mockUsers } });
  });

  test("renders loading initially and then users", async () => {
    render(<Users />);
    expect(screen.getByText(/loading users/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("filters users by search input", async () => {
    render(<Users />);
    await waitFor(() => screen.getByText("Alice"));
    const input = screen.getByPlaceholderText(/search users/i);
    fireEvent.change(input, { target: { value: "bob" } });
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  test("opens add user form", async () => {
    render(<Users />);
    const addButton = screen.getByText(/add user/i);
    userEvent.click(addButton);
    expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
  });

  test("adds a new user via form", async () => {
    axios.post = jest.fn().mockResolvedValue({ data: { success: true } });
    render(<Users />);
    userEvent.click(screen.getByText(/add user/i));
    
    userEvent.type(screen.getByPlaceholderText("Name"), "Charlie");
    userEvent.type(screen.getByPlaceholderText("Email"), "charlie@example.com");
    userEvent.type(screen.getByPlaceholderText("Password"), "123456");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "lecturer" } });

    const submitBtn = screen.getByText(/add user/i, { selector: "button" });
    userEvent.click(submitBtn);

    await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(1));
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/users/create"),
      expect.objectContaining({ name: "Charlie", email: "charlie@example.com", role: "lecturer" }),
      expect.any(Object)
    );
  });
});
