import React from "react";
import Input, { Select } from "../layout/FormFields";
import Btn from "../layout/Btn";

const UserForm = ({
  editingUserId,
  formData,
  newLabRoom,
  setNewLabRoom,
  handleChange,
  handleAddLabRoom,
  handleRemoveLabRoom,
  handleSubmit,
  handleCancel,
  submitLoading,
  labDropdownRef,
}) => (
  <form
    onSubmit={handleSubmit}
    className="flex flex-col space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl shadow-sm mb-6"
  >
    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-250 border-b border-slate-100 dark:border-slate-800 pb-2">
      {editingUserId ? "Edit User Account Details" : "Create New User Account"}
    </h3>

    <Input label="Name" id="name" type="text" name="name" value={formData.name} onChange={handleChange} />
    <Input label="Email" id="email" type="email" name="email" value={formData.email} onChange={handleChange} />
    <Input label="Password" id="password" type="password" name="password" value={formData.password} onChange={handleChange} />

    <Select label="Role" id="role" name="role" value={formData.role} onChange={handleChange}>
      <option value="">Select Role</option>
      <option value="admin">Admin</option>
      <option value="lecturer">Lecturer</option>
    </Select>

    <div className="flex items-center gap-2.5 py-1">
      <input
        type="checkbox"
        id="isActive"
        name="isActive"
        checked={formData.isActive}
        onChange={(e) => handleChange({ target: { name: "isActive", value: e.target.checked } })}
        className="w-4 h-4 text-indigo-600 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500 bg-white dark:bg-slate-950"
        disabled={formData.name === "admin" && formData.email === "admin@gmail.com"}
      />
      <label
        htmlFor="isActive"
        className={`text-xs font-bold text-slate-650 dark:text-slate-350 uppercase tracking-wider select-none ${
          formData.name === "admin" && formData.email === "admin@gmail.com" ? "opacity-50" : ""
        }`}
      >
        Active Account
      </label>
    </div>

    <div className="flex flex-col gap-2">
      <label htmlFor="labRoom" className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
        Add Lab Room
      </label>
      <div className="flex gap-2">
        <input
          id="labRoom"
          type="text"
          value={newLabRoom}
          onChange={(e) => setNewLabRoom(e.target.value)}
          className="border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 flex-1"
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddLabRoom(); } }}
        />
        <Btn type="button" variant="dark" onClick={handleAddLabRoom}>Add</Btn>
      </div>

      {formData.labRooms.length > 0 && (
        <div ref={labDropdownRef} className="flex flex-wrap gap-2 mt-2">
          {formData.labRooms.map((room, i) => (
            <span key={i} className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-100/50 dark:border-indigo-900/30 px-3 py-1 rounded-2xl text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              {room}
              <button type="button" onClick={() => handleRemoveLabRoom(room)} className="text-red-500 font-bold hover:text-red-700 transition">×</button>
            </span>
          ))}
        </div>
      )}
    </div>

    <div className="flex gap-2 pt-2">
      <Btn type="submit" variant="primary" disabled={submitLoading} className="flex-1">
        {submitLoading ? (editingUserId ? "Saving..." : "Adding...") : (editingUserId ? "💾 Save Changes" : "➕ Add User")}
      </Btn>
      <Btn type="button" variant="ghost" onClick={handleCancel}>Cancel</Btn>
    </div>
  </form>
);

export default UserForm;
