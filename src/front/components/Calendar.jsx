import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import CreateEvent from './CreateEvent';
import useGlobalReducer from '../hooks/useGlobalReducer.jsx';

import {
  apiListEvents, apiCreateEvent, apiUpdateEvent, apiDeleteEvent,
  apiListTasks,  apiCreateTask,  apiUpdateTask,  apiDeleteTask,
  apiListCalendars
} from '../lib/api';

const Calendar = () => {
  const { store, dispatch } = useGlobalReducer();
  const calendarRef = useRef(null);
  const [popover, setPopover] = useState(null);
  const [title, setTitle] = useState('');

  // 👉 Opcional: si true, también mandamos el rango visible (start/end) en hora local
  const useLocalRangeFilters = true;

  const defaultCalendarId = store.calendar[0]?.id?.toString() || null;

  // --- Utilidades ---
  const getLocalDateString = (date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatItemDates = (item) => {
    if (item.type === "event") {
      return { ...item, start: item.startDate, end: item.endDate || undefined };
    } else {
      return { ...item, start: item.startDate || undefined, end: undefined, extendedStartTime: item.startTime || '' };
    }
  };

  const getCalendarsColors = () => {
    const obj = {};
    store.calendar.forEach(cal => {
      obj[cal.id] = {
        background: cal.color + '30',
        border: cal.color + '00',
        text: cal.color,
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

  // --- Mapeo backend ⇄ store ---
  const mapEventFromApi = (e) => ({
    id: String(e.id),
    type: 'event',
    title: e.title,
    startDate: e.start_date,
    endDate: e.end_date,
    allDay: false,
    calendarId: e.calendar_id != null ? String(e.calendar_id) : undefined,
    color: e.color || undefined,
    startTime: e.start_date?.slice(11,16) || '',
    endTime: e.end_date?.slice(11,16) || ''
  });

  const mapTaskFromApi = (t) => ({
    id: String(t.id),
    type: 'task',
    title: t.title,
    startDate: t.date,
    startTime: t.date?.slice(11,16) || '',
    done: !!t.status,
    groupId: t.task_group_id != null ? String(t.task_group_id) : undefined,
    color: t.color || undefined
  });

  // --- helpers fecha/hora ---
  const pad2 = (n) => String(n).padStart(2, '0');
  const toLocalISOMin = (d) => {
    const dt = (d instanceof Date) ? d : new Date(d);
    return `${dt.getFullYear()}-${pad2(dt.getMonth()+1)}-${pad2(dt.getDate())}T${pad2(dt.getHours())}:${pad2(dt.getMinutes())}`;
  };
  const parseLocal = (s) => new Date((s && s.length > 10) ? s : `${s}T00:00`);
  const addMinutes = (s, mins) => { const d = parseLocal(s); d.setMinutes(d.getMinutes()+mins); return toLocalISOMin(d); };
  const addDays = (s, days) => { const d = parseLocal(s); d.setDate(d.getDate()+days); return toLocalISOMin(d).slice(0,16); };

  // --- Hidratar calendarios si están vacíos ---
  useEffect(() => {
    (async () => {
      try {
        if (!store.calendar || store.calendar.length === 0) {
          const cals = await apiListCalendars();
          const normalized = Array.isArray(cals) ? cals.map(c => ({ ...c, id: String(c.id) })) : [];
          dispatch({ type: "SET_CALENDARS", payload: normalized });
        }
      } catch (e) {
        console.error("No se pudieron cargar calendarios:", e);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Cargar datos por rango visible (con defensas) ---
  const fetchCurrentRange = async () => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    const view = api.view;
    if (!view?.currentStart || !view?.currentEnd) return;

    // (Opcional) rango en local para ser consistente con lo que el back espera
    const startISO = useLocalRangeFilters ? toLocalISOMin(view.currentStart) : view.currentStart.toISOString();
    const endISO   = useLocalRangeFilters ? toLocalISOMin(view.currentEnd)   : view.currentEnd.toISOString();

    try {
      const [eventsRaw, tasksRaw] = await Promise.all([
        apiListEvents({ start: startISO, end: endISO }),
        apiListTasks({  start: startISO, end: endISO }),
      ]);

      const events = Array.isArray(eventsRaw) ? eventsRaw : (Array.isArray(eventsRaw?.results) ? eventsRaw.results : []);
      const tasks  = Array.isArray(tasksRaw)  ? tasksRaw  : (Array.isArray(tasksRaw?.results)  ? tasksRaw.results  : []);

      dispatch({ type: "SET_EVENTS", payload: events.map(mapEventFromApi) });
      dispatch({ type: "SET_TASKS",  payload: tasks.map(mapTaskFromApi) });
    } catch (err) {
      console.error("Error cargando rango:", err);
      dispatch({ type: "SET_EVENTS", payload: [] });
      dispatch({ type: "SET_TASKS",  payload: [] });
    }
  };

  useEffect(() => { fetchCurrentRange(); }, []);

  // --- CRUD (con guard de calendar_id y normalización de fechas) ---
  const handleAddItem = async (item) => {
    if (!item.title?.trim()) return;

    if (item.type === 'event') {
      // Determinar calendar_id válido
      const numericId = (val) => /^\d+$/.test(String(val));
      const chosenId = item.calendarId && numericId(item.calendarId)
        ? parseInt(item.calendarId, 10)
        : (defaultCalendarId && numericId(defaultCalendarId) ? parseInt(defaultCalendarId, 10) : null);

      if (!chosenId) {
        alert("Crea o selecciona un calendario válido antes de guardar el evento.");
        return;
      }

      // start/end normalizados
      let start = item.startDate;
      let end   = item.endDate || item.startDate;
      const isAllDay = !!item.allDay;
      const hasTime  = (s) => (s || '').includes('T');

      if (!hasTime(start)) start = `${start}T00:00`;
      if (!hasTime(end))   end   = `${end}T00:00`;

      const startD = parseLocal(start);
      let endD     = parseLocal(end);

      if (isAllDay) {
        if (!item.endDate || endD <= startD) {
          end = addDays(start, 1).slice(0,16);
          end = `${end.slice(0,10)}T00:00`;
        }
      } else {
        if (endD <= startD) end = addMinutes(start, 15);
      }

      const payload = {
        title: item.title,
        start_date: start,
        end_date:   end,
        calendar_id: chosenId,
        color: item.color || null,
        description: item.description || null
      };

      const saved = item.id
        ? await apiUpdateEvent(item.id, payload)
        : await apiCreateEvent(payload);

      const normalized = mapEventFromApi(saved);
      dispatch({ type: item.id ? "UPDATE_EVENT" : "ADD_EVENT", payload: normalized });

    } else {
      // TASK
      let taskDate = item.startDate;
      const hasTime = (s) => (s || '').includes('T');
      if (!hasTime(taskDate) && item.startTime) taskDate = `${taskDate}T${item.startTime}`;

      const payload = {
        title: item.title,
        date: taskDate,
        task_group_id: item.groupId ? parseInt(item.groupId, 10) : undefined,
        status: !!item.done,
        color: item.color || null
      };

      const saved = item.id
        ? await apiUpdateTask(item.id, payload)
        : await apiCreateTask(payload);

      const normalized = mapTaskFromApi(saved);
      dispatch({ type: item.id ? "UPDATE_TASK" : "ADD_TASK", payload: normalized });
    }

    setPopover(null);
  };

  const handleDeleteItem = async (itemId, itemType) => {
    if (!itemId) return;

    if (itemType === 'event') {
      await apiDeleteEvent(itemId);
      dispatch({ type: "DELETE_EVENT", payload: String(itemId) });
    } else {
      await apiDeleteTask(itemId);
      dispatch({ type: "DELETE_TASK", payload: String(itemId) });
    }
    setPopover(null);
  };

  const toggleTaskDone = async (taskId) => {
    const existingTask = store.tasks.find(t => t.id.toString() === taskId.toString());
    if (existingTask) {
      const updated = await apiUpdateTask(taskId, { status: !existingTask.done, date: existingTask.startDate });
      dispatch({ type: "UPDATE_TASK", payload: mapTaskFromApi(updated) });
    }
  };

  // --- Drag & Resize ---
  const handleEventDrop = async (info) => {
    const { id, start, end } = info.event;
    const type = info.event.extendedProps.type;

    if (type === 'event') {
      // ✅ usar ISO local (no UTC) para evitar desfases
      const startISO = toLocalISOMin(start);
      const endISO   = toLocalISOMin(end || start);
      const updated  = await apiUpdateEvent(id, { start_date: startISO, end_date: endISO });
      dispatch({ type: "UPDATE_EVENT", payload: mapEventFromApi(updated) });

      info.event.setStart(updated.start_date);
      info.event.setEnd(updated.end_date);
    } else {
      const startISO = toLocalISOMin(start);
      const updated  = await apiUpdateTask(id, { date: startISO, status: info.event.extendedProps.done || false });
      dispatch({ type: "UPDATE_TASK", payload: mapTaskFromApi(updated) });

      info.event.setStart(updated.date);
      info.event.setEnd(undefined);
    }
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
        calendarId: defaultCalendarId || '',
      },
    });
  };

  const handleEventClick = (clickInfo) => {
    const { id, type } = clickInfo.event.extendedProps;

    const updatedItem = type === 'event'
      ? store.events.find(e => e.id.toString() === id.toString())
      : store.tasks.find(t => t.id.toString() === id.toString());

    if (!updatedItem) return;

    if (type === 'event') {
      const rect = clickInfo.jsEvent.target.getBoundingClientRect();
      let popoverWidth = 300, popoverHeight = 400;
      let x = rect.left + rect.width / 2 - popoverWidth / 2;
      let y = rect.top - popoverHeight - 10;
      if (x + popoverWidth > window.innerWidth) x = window.innerWidth - popoverWidth - 10;
      if (x < 0) x = 10;
      if (y < 0) y = rect.bottom + 10;

      setPopover({ x, y, item: { ...updatedItem, calendarId: updatedItem.calendarId || defaultCalendarId || '' } });
    } else if (type === 'task' && typeof onEditTask === 'function') {
      onEditTask(updatedItem);
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

  const handleDatesSet = () => { updateTitle(); fetchCurrentRange(); };

  // --- Renderizado ---
  const allItems = [
    ...store.events.map(e => ({ ...e, type: 'event' })),
    ...store.tasks.map(t => ({ ...t, type: 'task' }))
  ];

  const renderEventContent = (eventInfo) => {
    const { type, groupId, done, id, extendedStartTime } = eventInfo.event.extendedProps;
    const isAllDay = eventInfo.event.allDay;

    if (type === 'task') {
      const color = taskGroupsColors[groupId]?.border || '#000';
      const displayTime = !isAllDay && extendedStartTime ? extendedStartTime : '';
      return (
        <div className="flex items-center gap-2" style={{ padding: '4px 6px' }}>
          <div
            onClick={(e) => { e.stopPropagation(); toggleTaskDone(id); }}
            style={{
              width: '1em', height: '1em', minWidth: '12px', minHeight: '12px',
              borderRadius: '50%', border: `0.1em solid ${color}`,
              backgroundColor: done ? color : 'transparent',
              cursor: 'pointer', flexShrink: 0
            }}
          />
          {displayTime && <span style={{ marginRight: '0.3em', fontWeight: 'bold' }}>{displayTime}</span>}
          <span style={{ textDecoration: done ? 'line-through' : 'none' }}>
            {eventInfo.event.title}
          </span>
        </div>
      );
    } else {
      const startTimeDisplay = !isAllDay && eventInfo.event.start
        ? eventInfo.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        : '';
      return (
        <div style={{ padding: '4px 6px' }}>
          {startTimeDisplay && <span style={{ marginRight: '0.3em', fontWeight: 'bold' }}>{startTimeDisplay}</span>}
          {eventInfo.event.title}
        </div>
      );
    }
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
            id: item.id.toString(),
            start,
            end,
            title: item.title,
            allDay: item.allDay ?? false,
            backgroundColor: colors.background,
            borderColor: colors.border,
            textColor: colors.text,
            extendedProps: {
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
        datesSet={handleDatesSet}
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
