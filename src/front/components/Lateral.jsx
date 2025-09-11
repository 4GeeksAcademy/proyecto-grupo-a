import React, { useState } from "react";
import { Link } from "react-router-dom";

const Lateral = ({ onClose }) => {
  const [createCalendar, setCreateCalendar] = useState(false);
  const [createTask, setCreateTask] = useState(false);

  const [title, setTitle] = useState("");
  const [color, setColor] = useState("#ff0000");
  const [editingIndex, setEditingIndex] = useState(null); // índice del item que se edita
  const [editingType, setEditingType] = useState(""); // 'calendar' o 'task'

  const [calendars, setCalendars] = useState([]);
  const [tasks, setTasks] = useState([]);

  const resetForm = () => {
    setTitle("");
    setColor("#ff0000");
    setEditingIndex(null);
    setEditingType("");
    setCreateCalendar(false);
    setCreateTask(false);
  };

  const handleColorChange = (e) => setColor(e.target.value);
  const handleInputChange = (e) => {
    const value = e.target.value;
    if (/^#[0-9A-Fa-f]{0,6}$/.test(value)) setColor(value);
  };
  const handleTitleChange = (e) => setTitle(e.target.value);

  // Guardar calendario (crear o editar)
  const handleSubmitCalendar = (e) => {
    e.preventDefault();
    if (!title) return;

    if (editingIndex !== null && editingType === "calendar") {
      const updated = [...calendars];
      updated[editingIndex] = { title, color };
      setCalendars(updated);
    } else {
      setCalendars([...calendars, { title, color }]);
    }

    resetForm();
  };

  // Guardar tarea (crear o editar)
  const handleSubmitTask = (e) => {
    e.preventDefault();
    if (!title) return;

    if (editingIndex !== null && editingType === "task") {
      const updated = [...tasks];
      updated[editingIndex] = { title, color };
      setTasks(updated);
    } else {
      setTasks([...tasks, { title, color }]);
    }

    resetForm();
  };

  // Editar item
  const handleEdit = (index, type) => {
    const item = type === "calendar" ? calendars[index] : tasks[index];
    setTitle(item.title);
    setColor(item.color);
    setEditingIndex(index);
    setEditingType(type);
    if (type === "calendar") setCreateCalendar(true);
    else setCreateTask(true);
  };

  // Borrar item
  const handleDelete = (index, type) => {
    if (type === "calendar") {
      setCalendars(calendars.filter((_, i) => i !== index));
    } else {
      setTasks(tasks.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-gray-50 shadow-xl border-l border-gray-200 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
          <span className="font-medium text-gray-900">Usuario</span>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-1 text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Calendarios */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Calendarios</h3>
            <button className="text-gray-400 hover:text-gray-600" onClick={() => setCreateCalendar(true)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {calendars.length === 0 && <p className="text-sm text-gray-500">No hay calendarios aún</p>}
            {calendars.map((cal, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cal.color }}></div>
                  <span className="text-sm text-gray-700">{cal.title}</span>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => handleEdit(index, "calendar")} className="text-blue-500 text-xs">Editar</button>
                  <button onClick={() => handleDelete(index, "calendar")} className="text-red-500 text-xs">Borrar</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tareas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900">Tareas</h3>
            <button className="text-gray-400 hover:text-gray-600" onClick={() => setCreateTask(true)}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {tasks.length === 0 && <p className="text-sm text-gray-500">No hay tareas aún</p>}
            {tasks.map((task, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: task.color }}></div>
                  <span className="text-sm text-gray-700">{task.title}</span>
                </div>
                <div className="flex space-x-1">
                  <button onClick={() => handleEdit(index, "task")} className="text-blue-500 text-xs">Editar</button>
                  <button onClick={() => handleDelete(index, "task")} className="text-red-500 text-xs">Borrar</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Formulario Crear/Editar Calendario */}
      {createCalendar && (
        <div className="card p-4 border rounded bg-white absolute top-20 left-4 w-72 shadow-lg">
          <h3 className="font-semibold mb-2">{editingType === "calendar" ? "Editar calendario" : "Crear calendario"}</h3>
          <form onSubmit={handleSubmitCalendar} className="space-y-3">
            <div className="flex flex-col">
              <label>Título:</label>
              <input
                type="text"
                className="border rounded px-2 py-1"
                value={title}
                onChange={handleTitleChange}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <label>Color:</label>
              <input type="color" value={color} onChange={handleColorChange} />
              <input
                type="text"
                value={color}
                onChange={handleInputChange}
                className="border rounded px-2 py-1 w-20"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={resetForm} className="btn btn-secondary">Cerrar</button>
              <button type="submit" className="btn btn-success">Guardar</button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario Crear/Editar Tarea */}
      {createTask && (
        <div className="card p-4 border rounded bg-white absolute top-20 left-4 w-72 shadow-lg">
          <h3 className="font-semibold mb-2">{editingType === "task" ? "Editar tarea" : "Crear tarea"}</h3>
          <form onSubmit={handleSubmitTask} className="space-y-3">
            <div className="flex flex-col">
              <label>Título:</label>
              <input
                type="text"
                className="border rounded px-2 py-1"
                value={title}
                onChange={handleTitleChange}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <label>Color:</label>
              <input type="color" value={color} onChange={handleColorChange} />
              <input
                type="text"
                value={color}
                onChange={handleInputChange}
                className="border rounded px-2 py-1 w-20"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={resetForm} className="btn btn-secondary">Cerrar</button>
              <button type="submit" className="btn btn-success">Guardar</button>
            </div>
          </form>
        </div>
      )}
	  <div>
		
	  </div>
    </div>
  );
};

export default Lateral;
