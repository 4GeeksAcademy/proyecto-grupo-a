import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import CreateEvent from './CreateEvent';

const Calendar = () => {
  const calendarRef = useRef(null);
  const [popover, setPopover] = useState(null);
  const [title, setTitle] = useState('');

  // Colores base
  const baseCalendars = {
    trabajo: '#4A90E2',
    personal: '#50E3C2',
    cumpleaños: '#F5A623',
  };

  const calendars = Object.fromEntries(
    Object.entries(baseCalendars).map(([key, color]) => [
      key,
      {
        background: color + '30',
        border: color + '00',
        text: color,
      },
    ])
  );

  const taskGroups = {
    hogar: { background: '#ffffff00', border: '#998419', text: '#998419' },
    trabajo: { background: '#ffffff00', border: '#307522', text: '#307522' },
  };

  const [items, setItems] = useState([
    {
      id: 1,
      title: 'Reunión',
      start: '2025-09-10T10:00:00',
      end: '2025-09-10T11:00:00',
      type: 'event',
      calendarId: 'trabajo',
    },
    {
      id: 2,
      title: 'Cumpleaños',
      start: '2025-09-15',
      allDay: true,
      type: 'event',
      calendarId: 'cumpleaños',
    },
    {
      id: 3,
      title: 'Comprar comida',
      start: '2025-09-12',
      type: 'task',
      groupId: 'hogar',
      done: false,
    },
    {
      id: 4,
      title: 'Enviar informe',
      start: '2025-09-13',
      type: 'task',
      groupId: 'trabajo',
      done: false,
    },
  ]);


  // Crear o editar item
  const handleAddItem = (item) => {
    if (item.id) {
      // Editar item existente
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, ...item } : i))
      );
    } else {
      // Crear nuevo item
      if (item.type === 'event') {
        // Generar start y end en formato ISO
        const start = item.allDay
          ? item.startDate
          : new Date(`${item.startDate}T${item.startTime}`).toISOString();
        const end = item.allDay
          ? item.endDate
          : new Date(`${item.endDate}T${item.endTime}`).toISOString();

        setItems((prev) => [
          ...prev,
          { ...item, id: Date.now(), start, end },
        ]);
      } else if (item.type === 'task') {
        // Las tareas tienen startDate opcional
        const start = item.startDate
          ? item.startDate
          : new Date().toISOString().split('T')[0];

        setItems((prev) => [
          ...prev,
          { ...item, id: Date.now(), start, done: item.done ?? false },
        ]);
      }
    }
    // Cerrar el popover al guardar
    setPopover(null);
  };

  // Click en día vacío
  const handleDateClick = (arg) => {
    const rect = arg.dayEl.getBoundingClientRect();
    let popoverWidth = 300;
    let popoverHeight = 400;

    let x = rect.left + rect.width / 2 - popoverWidth / 2;
    let y = rect.top - popoverHeight - 10;

    if (x + popoverWidth > window.innerWidth)
      x = window.innerWidth - popoverWidth - 10;
    if (x < 0) x = 10;
    if (y < 0) y = rect.bottom + 10;

    setPopover({
      x,
      y,
      item: {
        type: 'event',
        startDate: arg.dateStr,
        endDate: arg.dateStr,
        allDay: true,
        calendarId: 'trabajo',
      },
    });
  };

  // Click en evento o tarea
  const handleEventClick = (clickInfo) => {
    const item = clickInfo.event.extendedProps;
    const rect = clickInfo.jsEvent.target.getBoundingClientRect();
    let popoverWidth = 300;
    let popoverHeight = 400;

    let x = rect.left + rect.width / 2 - popoverWidth / 2;
    let y = rect.top - popoverHeight - 10;

    if (x + popoverWidth > window.innerWidth)
      x = window.innerWidth - popoverWidth - 10;
    if (x < 0) x = 10;
    if (y < 0) y = rect.bottom + 10;

    setPopover({ x, y, item });
  };

  const toggleTaskDone = (taskId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === taskId ? { ...item, done: !item.done } : item
      )
    );
  };

  const renderEventContent = (eventInfo) => {
    const { type, groupId, done, id } = eventInfo.event.extendedProps;
    const isAllDay = eventInfo.event.allDay;

    if (type === 'task') {
      const color = taskGroups[groupId]?.border || '#000';
      return (
        <div className="flex items-center gap-2" style={{ padding: '4px 6px' }}>
          <div
           onClick={(e) => {
    e.stopPropagation(); 
    toggleTaskDone(id);
  }}
            style={{
              width: '1em',
              height: '1em',
              minWidth: '12px',
              minHeight: '12px',
              borderRadius: '50%',
              border: `0.1em solid ${color}`,
              backgroundColor: done ? color : 'transparent',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          />
          <span>{eventInfo.event.title}</span>
        </div>
      );
    } else {
      const startTime =
        !isAllDay && eventInfo.event.start
          ? eventInfo.event.start.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '';

      return (
        <div style={{ padding: '4px 6px' }}>
          {startTime && (
            <span style={{ marginRight: '0.3em', fontWeight: 'bold' }}>
              {startTime}
            </span>
          )}
          {eventInfo.event.title}
        </div>
      );
    }
  };

  useEffect(() => {
    const closePopover = (e) => {
      if (popover && !e.target.closest('.popover-form')) {
        setPopover(null);
      }
    };
    document.addEventListener('mousedown', closePopover);
    return () => document.removeEventListener('mousedown', closePopover);
  }, [popover]);

  // Toolbar personalizada
  const goPrev = () => {
    calendarRef.current?.getApi().prev();
    updateTitle();
  };

  const goNext = () => {
    calendarRef.current?.getApi().next();
    updateTitle();
  };

  const goToday = () => {
    calendarRef.current?.getApi().today();
    updateTitle();
  };

  const handleViewChange = (e) => {
    calendarRef.current?.getApi().changeView(e.target.value);
    updateTitle();
  };

  const updateTitle = () => {
    setTitle(calendarRef.current?.getApi().view.title || '');
  };

  return (
    <div>
      <div className="custom-toolbar flex justify-between mb-2">
        <div className="left-controls flex gap-1">
          <button
            onClick={goPrev}
            className="fc-button fc-button-primary fc-icon fc-icon-chevron-left"
          />
          <button onClick={goToday} className="fc-button fc-button-primary">
            Hoy
          </button>
          <button
            onClick={goNext}
            className="fc-button fc-button-primary fc-icon fc-icon-chevron-right"
          />
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
        editable={true}
        eventDurationEditable={true}
        events={items.map((item) => ({
          ...item,
          allDay: item.type === 'task' ? true : !!item.allDay,
          backgroundColor:
            item.type === 'event'
              ? calendars[item.calendarId]?.background
              : taskGroups[item.groupId]?.background,
          borderColor:
            item.type === 'event'
              ? calendars[item.calendarId]?.border
              : taskGroups[item.groupId]?.border,
          textColor:
            item.type === 'event'
              ? calendars[item.calendarId]?.text
              : taskGroups[item.groupId]?.text,
          extendedProps: { ...item },
          display: 'block',
          startEditable: true,
          durationEditable: item.type === 'event',
          editable: true,
        }))}
        displayEventTime={true}
        eventContent={renderEventContent}
        dateClick={handleDateClick}
        eventClick={handleEventClick}
        selectable={true}
        datesSet={updateTitle}
        height="auto"
        expandRows={true}
        nowIndicator={true}
        eventTimeFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }}
        dayMaxEvents={3}
      />

      {popover && (
        <div
          className="popover bs-popover-top show position-absolute popover-form"
          style={{
            top: popover.y,
            left: popover.x,
            zIndex: 2000,
            minWidth: 320,
            maxWidth: 500,
            width: 'auto',
          }}
        >
          <div className="popover-arrow"></div>
          <div className="popover-body">
            <CreateEvent
              selectedDate={popover.item.startDate || popover.item.start}
              onAddItem={handleAddItem}
              calendarColors={calendars}
              taskGroups={taskGroups}
              item={popover.item} // para edición
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;
