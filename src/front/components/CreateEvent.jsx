import React, { useState, useEffect } from "react";

const CreateEvent = ({ selectedDate, onAddItem, calendarColors, taskGroups, item }) => {
  // Detectar si es edición
  const isEdit = !!item?.id;
  const isTask = item?.type === 'task';

  const [activeTab, setActiveTab] = useState(
    isEdit ? (isTask ? "tarea" : "evento") : "evento"
  );

  const [eventTitle, setEventTitle] = useState(item?.title || "");
  const [eventCalendar, setEventCalendar] = useState(item?.calendarId || "trabajo");
  const [allDay, setAllDay] = useState(item?.allDay ?? true);
  const [repeat, setRepeat] = useState(item?.repeat || false);
  const [checkedDays, setCheckedDays] = useState(item?.checkedDays || Array(7).fill(false));
  const [startDate, setStartDate] = useState(item?.startDate || selectedDate || "");
  const [endDate, setEndDate] = useState(item?.endDate || selectedDate || "");
  const [startTime, setStartTime] = useState(item?.startTime || "09:00");
  const [endTime, setEndTime] = useState(item?.endTime || "10:00");

  const [taskTitle, setTaskTitle] = useState(item?.title || "");
  const [taskGroup, setTaskGroup] = useState(item?.groupId || "grupo1");
  const [taskRepeat, setTaskRepeat] = useState(item?.repeat || false);
  const [taskFrequencyNum, setTaskFrequencyNum] = useState(item?.frequencyNum || 1);
  const [taskFrequencyUnit, setTaskFrequencyUnit] = useState(item?.frequencyUnit || "día");

  const toggleDay = (index) => {
    const newDays = [...checkedDays];
    newDays[index] = !newDays[index];
    setCheckedDays(newDays);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeTab === "evento") {
      onAddItem({
        id: item?.id,
        type: "event",
        title: eventTitle,
        allDay,
        repeat,
        checkedDays,
        startDate,
        endDate,
        startTime,
        endTime,
        calendarId: eventCalendar
      });
    } else {
      onAddItem({
        id: item?.id,
        type: "task",
        title: taskTitle,
        groupId: taskGroup,
        repeat: taskRepeat,
        frequencyNum: taskFrequencyNum,
        frequencyUnit: taskFrequencyUnit,
        startDate,
      });
    }
  };

  const groupColors = {
    grupo1: "bg-red-500",
    grupo2: "bg-yellow-500",
    grupo3: "bg-green-500",
  };

  useEffect(() => {
    if (!isEdit) {
      setStartDate(selectedDate);
      setEndDate(selectedDate);
    }
  }, [selectedDate, isEdit]);

  return (
    <div className="d-flex flex-column gap-2">
      {/* Solo mostrar tabs si NO es edición */}
      {!isEdit && (
        <ul className="nav nav-pills mb-2 justify-center">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "evento" ? "active" : ""}`}
              onClick={() => setActiveTab("evento")}
            >
              Evento
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "tarea" ? "active" : ""}`}
              onClick={() => setActiveTab("tarea")}
            >
              Tarea
            </button>
          </li>
        </ul>
      )}

      {/* Formulario Evento */}
      {activeTab === "evento" && (
        <form onSubmit={handleSubmit}>
          <div className="flex mb-2">
            <label className="me-2 w-24">Título</label>
            <input
              className="form-control"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex mb-2 items-center gap-2">
            <label className="me-2 w-24">Calendario</label>
            <select
              className="form-select"
              value={eventCalendar}
              onChange={(e) => setEventCalendar(e.target.value)}
            >
              {Object.keys(calendarColors).map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
            <div
              className="w-6 h-6 rounded-full border"
              style={{
                backgroundColor: calendarColors[eventCalendar]?.background || '#ccc',
                borderColor: calendarColors[eventCalendar]?.border || '#888',
              }}
            />
          </div>

          <div className="flex mb-2 items-center gap-2">
            <label className="me-2">Todo el día</label>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={allDay}
                onChange={() => setAllDay(!allDay)}
              />
            </div>
          </div>

          <div className="flex mb-2 items-center gap-2">
            <label className="w-24">Fecha inicio</label>
            <input
              type="date"
              className="form-control"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            {!allDay && (
              <input
                type="time"
                className="form-control"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            )}
          </div>

          <div className="flex mb-2 items-center gap-2">
            <label className="w-24">Fecha fin</label>
            <input
              type="date"
              className="form-control"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            {!allDay && (
              <input
                type="time"
                className="form-control"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            )}
          </div>

          <div className="flex mb-2 items-center gap-2">
            <label className="me-2">Repetir</label>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={repeat}
                onChange={() => setRepeat(!repeat)}
              />
            </div>
          </div>

          {repeat && (
            <div className="flex gap-2 mt-2">
              {["L", "M", "X", "J", "V", "S", "D"].map((initial, i) => (
                <div
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-sm font-bold
                    ${checkedDays[i] ? "bg-gray-500 text-white" : "bg-white border border-gray-400 text-gray-800"}`}
                >
                  {initial}
                </div>
              ))}
            </div>
          )}

          <div className="flex mt-2 gap-2">
            <button type="submit" className="btn btn-primary btn-sm">Guardar</button>
          </div>
        </form>
      )}

      {/* Formulario Tarea */}
      {activeTab === "tarea" && (
        <form onSubmit={handleSubmit}>
          <div className="flex mb-2 items-center gap-2">
            <label className="w-24">Título</label>
            <input
              className="form-control"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              required
            />
          </div>

          <div className="flex mb-2 items-center gap-2">
            <label className="w-24">Grupo</label>
            <select
              className="form-select w-auto"
              value={taskGroup}
              onChange={(e) => setTaskGroup(e.target.value)}
            >
              {Object.keys(taskGroups).map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
            <div className={`w-6 h-6 rounded-full ${groupColors[taskGroup]}`}></div>
          </div>
 <div className="flex mb-2 items-center gap-2">
      <label className="w-24">Fecha</label>
      <input
        type="date"
        className="form-control  w-auto flex-shrink-0"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
      />
      
        <input
          type="time"
          className="form-control"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
    </div>

          <div className="flex mb-2 items-center gap-2">

            <label className="w-24">Repetir</label>
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                checked={taskRepeat}
                onChange={() => setTaskRepeat(!taskRepeat)}
              />
            </div>
          </div>

          {taskRepeat && (
            <div className="flex mb-2 items-center gap-2">
              <label className="w-24">Cada</label>
              <input
                type="number"
                className="form-control w-24"
                min={1}
                value={taskFrequencyNum}
                onChange={(e) => setTaskFrequencyNum(e.target.value)}
              />
              <select
                className="form-select w-auto"
                value={taskFrequencyUnit}
                onChange={(e) => setTaskFrequencyUnit(e.target.value)}
              >
                <option value="día">día/s</option>
                <option value="semana">semana/s</option>
                <option value="mes">mes/es</option>
                <option value="año">año/s</option>
              </select>
            </div>
          )}

          <div className="flex mt-2 gap-2">
            <button type="submit" className="btn btn-primary btn-sm">Guardar</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CreateEvent;
