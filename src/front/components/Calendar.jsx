import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import CreateEvent from './CreateEvent';
import useGlobalReducer from '../hooks/useGlobalReducer.jsx';
import { apiUpdateUserTask, apiDeleteUserTask, apiCreateEvent, apiUpdateEvent, apiDeleteEvent, getUserId } from "../lib/api.js";
const Calendar = () => {
  const { store, dispatch } = useGlobalReducer();
  const calendarRef = useRef(null);
  const [popover, setPopover] = useState(null);
  const [title, setTitle] = useState('');

  const defaultCalendarId = store.calendar[0]?.id || null;

  // helper: HH:mm sin AM/PM
  const formatTime = (d) =>
    d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false }) : "";


  // --- Utilidades ---
  const getLocalDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Reemplaza tu formatItemDates por este
  const formatItemDates = (item) => {
    if (item.type === "event") {
      const allDay = !!item.allDay;

      // Para all-day, FullCalendar espera solo YYYY-MM-DD
      if (allDay) {
        return {
          ...item,
          start: item.startDate,                                // "YYYY-MM-DD"
          end: item.endDate || item.startDate || undefined,     // mismo día si no viene
        };
      }

      // Con horas: unimos fecha + hora si hay startTime/endTime
      const start =
        item.startTime
          ? `${item.startDate}T${item.startTime}`               // "YYYY-MM-DDTHH:MM"
          : item.startDate;                                     // fallback

      const endBase = item.endDate || item.startDate;
      const end =
        item.endTime
          ? `${endBase}T${item.endTime}`
          : (endBase
            ? `${endBase}T${item.startTime || "00:00"}`
            : undefined);

      return { ...item, start, end };
    }

    // Tasks: igual que antes
    return {
      ...item,
      start: item.startDate || undefined,
      end: undefined,
      extendedStartTime: item.startTime || ''
    };
  };


  // Pequeño ajuste para evitar undefined en colores
  const getCalendarsColors = () => {
    const obj = {};
    store.calendar.forEach(cal => {
      obj[cal.id] = {
        background: (cal.color || '#94a3b8') + '30',
        border: (cal.color || '#94a3b8') + '00',
        text: cal.color || '#334155',
      };
    });
    return obj;
  };


  const getTaskGroupsColors = () => {
    const obj = {};
    store.taskGroup.forEach(group => {
      obj[group.id] = {
        background: '#ffffff00',
        border: group.color,
        text: group.color,
      };
    });
    return obj;
  };

  const calendarsColors = getCalendarsColors();
  const taskGroupsColors = getTaskGroupsColors();

  // --- CRUD --- (modificado max para actualixar al momento y no recargar la pajina)
  const handleAddItem = async (item) => {
    if (!item.title?.trim()) return;

    const isEvent = item.type === 'event';

    // --- EVENTOS (persistencia real con optimistic UI) ---
    if (isEvent) {
      const isUpdate = !!item.id;

      // ↪️ ACTUALIZAR
      if (isUpdate) {
        const optimistic = { ...item, id: String(item.id) };
        // Optimistic
        dispatch({ type: "UPDATE_EVENT", payload: optimistic });
        try {
          const body = toBackendEventBody(optimistic);
          const data = await apiUpdateEvent(optimistic.id, body);
          const normalized = normalizeEventFromServer(data);
          dispatch({ type: "UPDATE_EVENT", payload: normalized });
        } catch (e) {
          // Rollback a lo que tenías antes
          dispatch({ type: "UPDATE_EVENT", payload: item });
          console.error("Error guardando evento:", e);
          alert(e?.message || "No se pudo guardar el evento");
        }
        setPopover(null);
        return;
      }

      // ↪️ CREAR
      const tempId = (Date.now() + Math.random()).toString();
      const optimistic = {
        ...item,
        id: tempId,
      };

      // 1) Optimistic: lo mostramos ya
      dispatch({ type: "ADD_EVENT", payload: optimistic });

      try {
        // 2) Llamada real
        const body = toBackendEventBody(optimistic);
        const data = await apiCreateEvent(body);
        const normalized = normalizeEventFromServer(data);

        // 3) Reemplazar el temporal por el real
        dispatch({ type: "DELETE_EVENT", payload: tempId });
        dispatch({ type: "ADD_EVENT", payload: normalized });
      } catch (e) {
        // 4) Rollback si falla
        dispatch({ type: "DELETE_EVENT", payload: tempId });
        console.error("Error guardando evento:", e);
        alert(e?.message || "No se pudo guardar el evento");
      }

      setPopover(null);
      return;
    }

    // --- TAREAS (igual que ya tenías) ---
    const formattedItem = {
      ...item,
      id: item.id ? String(item.id) : (Date.now() + Math.random()).toString(),
    };
    const exists = store.tasks.some(x => String(x.id) === String(formattedItem.id));
    dispatch({ type: exists ? "UPDATE_TASK" : "ADD_TASK", payload: formattedItem });
    setPopover(null);
  };





  // MODIFICADO: borrar EVENTO con API + rollback
  const handleDeleteItem = async (itemId, itemType) => {
    if (!itemId) return;

    if (itemType === "event") {
      const prev = store.events.find(e => String(e.id) === String(itemId));

      // Optimistic
      dispatch({ type: "DELETE_EVENT", payload: itemId });
      setPopover(null);

      try {
        await apiDeleteEvent(Number(itemId));
      } catch (e) {
        // Rollback
        if (prev) dispatch({ type: "ADD_EVENT", payload: prev });
        console.error("Error borrando evento:", e);
        alert(e?.message || "No se pudo borrar el evento");
      }
      return;
    }

    // --- TAREA (tu flujo actual)
    const userId = getUserId({ storeUser: store.user });
    if (!userId) {
      alert("No se pudo identificar al usuario.");
      return;
    }

    const taskToDelete = store.tasks.find(t => String(t.id) === String(itemId));

    dispatch({ type: "DELETE_TASK", payload: itemId });
    setPopover(null);

    try {
      await apiDeleteUserTask(Number(userId), Number(itemId));
    } catch (e) {
      if (taskToDelete) dispatch({ type: "ADD_TASK", payload: taskToDelete });
      console.error("Error borrando tarea:", e);
      alert(e?.message || "No se pudo borrar la tarea");
    }
  };




  const toggleTaskDone = async (taskId) => {
    const existingTask = store.tasks.find(t => String(t.id) === String(taskId));
    if (!existingTask) return;

    const userId = getUserId({ storeUser: store.user });
    if (!userId) {
      alert("No se pudo identificar al usuario.");
      return;
    }

    const newDone = !existingTask.done;

    // Optimistic update
    dispatch({
      type: "UPDATE_TASK",
      payload: { ...existingTask, done: newDone }
    });

    try {
      await apiUpdateUserTask(userId, Number(taskId), { status: newDone });
    } catch (e) {
      // Rollback si falla
      dispatch({
        type: "UPDATE_TASK",
        payload: { ...existingTask, done: !newDone }
      });
      console.error("No se pudo guardar el cambio de estado:", e);
      alert(e?.message || "No se pudo guardar el estado de la tarea");
    }
  };

  // NUEVO: partir ISO en fecha/hora
  const parseISOToParts = (iso) => {
    if (!iso) return { date: null, time: null };
    const [d, t] = String(iso).split('T');
    return { date: d, time: t ? t.slice(0, 5) : null };
  };

  // NUEVO: construir body para el backend de eventos
  // Reemplaza tu toBackendEventBody por este:
  const toBackendEventBody = (evt) => {
    const allDay = !!evt.allDay;

    // Separar fecha y hora si startDate/endDate ya venían con "T..."
    const s = parseISOToParts(evt.startDate);
    const e = parseISOToParts(evt.endDate || evt.startDate);

    const startDate = s.date;                 // "YYYY-MM-DD"
    const endDate = e.date;                 // "YYYY-MM-DD" (fallback al start)

    // Si es allDay no enviamos hora. Si no, prioridad:
    // 1) hora explícita del form (startTime/endTime)
    // 2) hora que ya venía embebida en startDate/endDate
    // 3) fallback "00:00" (y para end, fallback a startTime)
    const startTime = allDay ? '' : (evt.startTime || s.time || '00:00');
    const endTime = allDay ? '' : (evt.endTime || e.time || startTime || '00:00');

    const startIso = startTime ? `${startDate}T${startTime}` : startDate;
    const endIso = endTime ? `${endDate}T${endTime}` : endDate;

    const calendarIdNum = Number(evt.calendarId || defaultCalendarId);
    const cal = store.calendar.find(c => Number(c.id) === calendarIdNum);
    const safeColor = (evt.color ?? cal?.color ?? "");

    return {
      title: evt.title?.trim(),
      calendar_id: calendarIdNum,
      start_date: startIso,
      end_date: endIso,
      all_day: allDay,
      description: (evt.description ?? ""), // nunca null
      color: (safeColor ?? ""),             // nunca null
    };
  };


  // NUEVO: normalizar respuesta del backend -> shape del store
  const normalizeEventFromServer = (server) => {
    const s = String(server.start_date || "");
    const e = String(server.end_date || "");
    const { date: sDate, time: sTime } = parseISOToParts(s);
    const { date: eDate, time: eTime } = parseISOToParts(e);

    return {
      id: String(server.id),
      type: "event",
      title: server.title,
      calendarId: server.calendar_id,
      startDate: sDate || null,
      endDate: eDate || sDate || null,
      startTime: server.all_day ? "" : (sTime || ""),
      endTime: server.all_day ? "" : (eTime || ""),
      allDay: !!server.all_day,
      description: server.description || "",
      color: server.color || "",
    };
  };


  // --- Drag & Resize ---
  // MODIFICADO: al mover/redimensionar EVENTO, persiste en backend
  const handleEventDrop = async (info) => {
    const { type, originalId } = info.event.extendedProps; // 👈 el id real
    const { start, end, allDay } = info.event;

    const updatedItem = type === 'event'
      ? store.events.find(e => String(e.id) === String(originalId))
      : store.tasks.find(t => String(t.id) === String(originalId));

    if (!updatedItem) return;

    const payload = {
      ...updatedItem,
      startDate: getLocalDateString(start),
      endDate: type === 'event'
        ? (end ? getLocalDateString(end) : getLocalDateString(start))
        : undefined,
      startTime: type === 'event'
        ? (!allDay && start ? start.toTimeString().slice(0, 5) : '')
        : (updatedItem.startTime || ''),
      endTime: type === 'event'
        ? (!allDay && end ? end.toTimeString().slice(0, 5) : '')
        : '',
      allDay: type === 'event' ? allDay : false,
    };

    // Optimistic update
    dispatch({
      type: type === 'event' ? "UPDATE_EVENT" : "UPDATE_TASK",
      payload
    });

    if (type === 'task') {
      const userId = getUserId({ storeUser: store.user });
      if (userId) {
        const iso = payload.startTime
          ? `${payload.startDate}T${payload.startTime}:00`
          : `${payload.startDate}T00:00:00`;
        try {
          await apiUpdateUserTask(Number(userId), Number(originalId), { date: iso });
        } catch (e) {
          dispatch({ type: "UPDATE_TASK", payload: updatedItem }); // rollback
          console.error("No se pudo guardar el cambio de día de la tarea:", e);
          alert(e?.message || "No se pudo guardar la tarea");
        }
      }
    }

    if (type === 'event') {
      try {
        const body = toBackendEventBody(payload);
        const data = await apiUpdateEvent(Number(originalId), body);
        const normalized = normalizeEventFromServer(data);
        dispatch({ type: "UPDATE_EVENT", payload: normalized });
      } catch (e) {
        console.error("No se pudo guardar el movimiento del evento:", e);
        alert(e?.message || "No se pudo guardar el evento");
      }
    }

    // reflejar en FullCalendar
    info.event.setStart(payload.startDate);
    info.event.setEnd(payload.endDate);
  };


  const handleEventResize = handleEventDrop;


  // --- Popover ---
  const handleDateClick = (arg) => {
    const rect = arg.dayEl.getBoundingClientRect();
    let popoverWidth = 300, popoverHeight = 400;
    let x = rect.left + rect.width / 2 - popoverWidth / 2;
    let y = rect.top - popoverHeight - 10;
    if (x + popoverWidth > window.innerWidth) x = window.innerWidth - popoverWidth - 10;
    if (x < 0) x = 10;
    if (y < 0) y = rect.bottom + 10;

    setPopover({
      x, y,
      item: {
        type: 'event',
        startDate: arg.dateStr,
        endDate: arg.dateStr,
        allDay: true,
        calendarId: defaultCalendarId,
      },
    });
  };

  const handleEventClick = (clickInfo) => {
    const { type, originalId } = clickInfo.event.extendedProps;

    const updatedItem = type === 'event'
      ? store.events.find(e => e.id === String(originalId))
      : store.tasks.find(t => t.id === String(originalId));

    if (!updatedItem) return;

    if (type === 'event') {
      const rect = clickInfo.jsEvent.target.getBoundingClientRect();
      let popoverWidth = 300, popoverHeight = 400;
      let x = rect.left + rect.width / 2 - popoverWidth / 2;
      let y = rect.top - popoverHeight - 10;
      if (x + popoverWidth > window.innerWidth) x = window.innerWidth - popoverWidth - 10;
      if (x < 0) x = 10;
      if (y < 0) y = rect.bottom + 10;

      setPopover({ x, y, item: { ...updatedItem, calendarId: updatedItem.calendarId || defaultCalendarId } });
    } else if (type === 'task') {
      const rect = clickInfo.jsEvent.target.getBoundingClientRect();
      let popoverWidth = 300, popoverHeight = 400;
      let x = rect.left + rect.width / 2 - popoverWidth / 2;
      let y = rect.top - popoverHeight - 10;
      if (x + popoverWidth > window.innerWidth) x = window.innerWidth - popoverWidth - 10;
      if (x < 0) x = 10;
      if (y < 0) y = rect.bottom + 10;

      setPopover({ x, y, item: updatedItem });
    }
  };

  useEffect(() => {
    const closePopover = (e) => {
      if (popover && !e.target.closest('.popover-form')) setPopover(null);
    };
    document.addEventListener('mousedown', closePopover);
    return () => document.removeEventListener('mousedown', closePopover);
  }, [popover]);

  // --- Toolbar ---
  const updateTitle = () => setTitle(calendarRef.current?.getApi().view.title || '');
  const goPrev = () => { calendarRef.current?.getApi().prev(); updateTitle(); };
  const goNext = () => { calendarRef.current?.getApi().next(); updateTitle(); };
  const goToday = () => { calendarRef.current?.getApi().today(); updateTitle(); };
  const handleViewChange = (e) => { calendarRef.current?.getApi().changeView(e.target.value); updateTitle(); };

  // --- Renderizado ---
  const allItems = [
    ...store.events.map(e => ({ ...e, type: 'event' })),
    ...store.tasks.map(t => ({ ...t, type: 'task' }))
  ];

  const renderEventContent = (eventInfo) => {
    const { type, groupId, done, id, extendedStartTime } = eventInfo.event.extendedProps;
    const isAllDay = eventInfo.event.allDay;

    if (type === "task") {
      const color = taskGroupsColors[groupId]?.border || "#000";
      const displayTime = !isAllDay && extendedStartTime ? extendedStartTime : "";
      return (
        <div className="flex items-center gap-2" style={{ padding: "4px 6px" }}>
          <div
            onClick={(e) => { e.stopPropagation(); toggleTaskDone(id); }}
            style={{
              width: "1em", height: "1em", minWidth: "12px", minHeight: "12px",
              borderRadius: "50%", border: `0.1em solid ${color}`,
              backgroundColor: done ? color : "transparent",
              cursor: "pointer", flexShrink: 0
            }}
          />
          {displayTime && <span style={{ marginRight: "0.3em", fontWeight: "bold" }}>{displayTime}</span>}
          <span style={{ textDecoration: done ? "line-through" : "none" }}>
            {eventInfo.event.title}
          </span>
        </div>
      );
    }

    // === EVENTO (con horas de inicio–fin) ===
    const startStr = !isAllDay
      ? (eventInfo.event.start ? formatTime(eventInfo.event.start) : (eventInfo.event.extendedProps.startTime || ""))
      : "";

    const endStr = !isAllDay
      ? (eventInfo.event.end ? formatTime(eventInfo.event.end) : (eventInfo.event.extendedProps.endTime || ""))
      : "";

    return (
      <div style={{ padding: "4px 6px" }}>
        {startStr && (
          <span style={{ marginRight: "0.3em", fontWeight: "bold" }}>
            {endStr ? `${startStr}–${endStr}` : startStr}
          </span>
        )}
        {eventInfo.event.title}
      </div>
    );
  };


  return (
    <div>
      <div className="custom-toolbar flex justify-between mb-2">
        <div className="left-controls flex gap-1 items-center">
          <button onClick={goPrev} className="fc-button fc-button-primary fc-icon fc-icon-chevron-left" />
          <button onClick={goToday} className="fc-button fc-button-primary">Hoy</button>
          <button onClick={goNext} className="fc-button fc-button-primary fc-icon fc-icon-chevron-right" />
        </div>
        <div className="center-title font-bold">{title}</div>
        <div className="right-controls">
          <select className="form-select" onChange={handleViewChange}>
            <option value="dayGridMonth">Mes</option>
            <option value="timeGridWeek">Semana</option>
          </select>
        </div>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={esLocale}
        headerToolbar={false}
        footerToolbar={false}
        droppable={true}
        events={allItems.map(item => {
          const formattedItem = formatItemDates(item);
          const { start, end, type, calendarId, groupId, ...rest } = formattedItem;
          const colors = type === 'event'
            ? calendarsColors[calendarId] || { background: '#f3f4f6', border: '#6b7280', text: '#374151' }
            : taskGroupsColors[groupId] || { background: '#f3f4f6', border: '#6b7280', text: '#374151' };
          return {
            start,
            end,
            title: item.title,
            allDay: item.allDay ?? false,
            backgroundColor: colors.background,
            borderColor: colors.border,
            textColor: colors.text,
            id: `${type}-${item.id}`, // único para FullCalendar
            extendedProps: {
              originalId: item.id,
              type,
              calendarId: type === 'event' ? calendarId || defaultCalendarId : undefined,
              groupId: type === 'task' ? groupId : undefined,
              done: item.done ?? false,
              ...rest
            },
            display: 'block',
            startEditable: true,
            durationEditable: type === 'event',
            editable: true,
          };
        })}
        displayEventTime
        eventContent={renderEventContent}
        dateClick={handleDateClick}
        selectable
        datesSet={updateTitle}
        height="auto"
        expandRows
        nowIndicator
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventClick={handleEventClick}
      />

      {popover && (
        <div className="popover bs-popover-top show position-absolute popover-form"
          style={{ top: popover.y, left: popover.x, zIndex: 2000, minWidth: 320, maxWidth: 500, width: 'auto' }}
        >
          <div className="popover-arrow"></div>
          <div className="popover-body">
            <CreateEvent
              selectedDate={popover.item.startDate || popover.item.start}
              onAddItem={handleAddItem}
              onDeleteItem={(itemId) => handleDeleteItem(itemId, popover.item.type)}
              item={popover.item}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
