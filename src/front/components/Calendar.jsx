import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

const Calendar = () => {
  const calendarRef = useRef(null);

  const calendars = {
    trabajo: { background: '#4A90E230', border: '#4A90E200', text: '#4A90E2' },
    personal: { background: '#50E3C230', border: '#50E3C200', text: '#50E3C2' },
    cumpleaños: { background: '#F5A62330', border: '#F5A62300', text: '#F5A623' },
  };

  const taskGroups = {
    hogar: { background: '#fff', border: '#998419', text: '#998419' },
    trabajo: { background: '#fff', border: '#307522', text: '#307522' },
  };

  const [items, setItems] = useState([
    { id: 1, title: 'Reunión', start: '2025-09-10T10:00:00', end: '2025-09-10T11:00:00', type: 'event', calendarId: 'trabajo' },
    { id: 2, title: 'Cumpleaños', start: '2025-09-15', allDay: "true", type: 'event', calendarId: 'cumpleaños' },
    { id: 3, title: 'Comprar comida', start: '2025-09-12', type: 'task', groupId: 'hogar', done: false },
    { id: 4, title: 'Enviar informe', start: '2025-09-13', type: 'task', groupId: 'trabajo', done: false },
  ]);

  const [title, setTitle] = useState('');
const handleDateClick = (arg) => {
  const taskOnDate = items.find(i => i.type === 'task' && new Date(i.start).toDateString() === arg.date.toDateString());
  if (taskOnDate) {
    const confirmMove = window.confirm(`Mover "${taskOnDate.title}" a ${arg.date.toLocaleDateString()}?`);
    if (confirmMove) {
      setItems(prev => prev.map(i =>
        i.id === taskOnDate.id ? { ...i, start: arg.date } : i
      ));
    }
  } else {
    // lógica para crear nuevo evento o tarea
    const titleInput = prompt('Introduce el título:');
    if (!titleInput) return;

    const type = prompt('Tipo: "event" o "task"?');
    if (type === 'event') {
      const calendarId = prompt('Calendario: trabajo, personal o cumpleaños');
      if (!calendars[calendarId]) return alert('Calendario no válido');
      setItems([...items, { id: Date.now(), title: titleInput, start: arg.date, allDay: arg.allDay, type, calendarId }]);
    } else if (type === 'task') {
      const groupId = prompt('Grupo de tareas: hogar o trabajo');
      if (!taskGroups[groupId]) return alert('Grupo no válido');
      setItems([...items, { id: Date.now(), title: titleInput, start: arg.date, allDay: arg.allDay, type, groupId, done: false }]);
    } else {
      alert('Tipo no válido');
    }
  }
};
  // Toolbar personalizada
  const goPrev = () => { calendarRef.current?.getApi().prev(); updateTitle(); };
  const goNext = () => { calendarRef.current?.getApi().next(); updateTitle(); };
  const goToday = () => { calendarRef.current?.getApi().today(); updateTitle(); };
  const handleViewChange = (e) => { calendarRef.current?.getApi().changeView(e.target.value); updateTitle(); };
  const updateTitle = () => { setTitle(calendarRef.current?.getApi().view.title || ''); };

  // Marcar tarea como hecha
  const toggleTaskDone = (taskId) => {
    setItems(prev =>
      prev.map(item => item.id === taskId ? { ...item, done: !item.done } : item)
    );
  };


  // Renderizado personalizado de eventos
  const renderEventContent = (eventInfo) => {
    const { type, groupId, done, id } = eventInfo.event.extendedProps;
    const isAllDay = eventInfo.event.allDay;

    if (type === 'task') {
      const color = taskGroups[groupId]?.border || '#000';
      return (
        <div className="flex items-center gap-2" style={{ padding: '4px 6px' }}>
          <div
            onClick={() => toggleTaskDone(id)}
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
      // Para eventos normales
      const startTime = !isAllDay && eventInfo.event.start
        ? eventInfo.event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';

      return (
        <div style={{ padding: '4px 6px' }}>
          {startTime && <span style={{ marginRight: '0.3em', fontWeight: 'bold' }}>{startTime}</span>}
          {eventInfo.event.title}
        </div>
      );
    }
  };


  return (
    <div>
      {/* Mi toolbar personalizada */}
      <div className="custom-toolbar flex justify-between mb-2">
        <div className="left-controls flex gap-1">
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
        editable={true}
        eventDurationEditable={true}
        events={items.map(item => ({
  ...item,
  allDay: item.type === 'task' ? true : !!item.allDay,
  backgroundColor: item.type === 'event'
    ? calendars[item.calendarId]?.background
    : taskGroups[item.groupId]?.background,
  borderColor: item.type === 'event'
    ? calendars[item.calendarId]?.border
    : taskGroups[item.groupId]?.border,
  textColor: item.type === 'event'
    ? calendars[item.calendarId]?.text
    : taskGroups[item.groupId]?.text,
  extendedProps: { ...item },
  display: 'block',
  startEditable: true,           // todas las tareas y eventos se pueden mover
  durationEditable: item.type === 'event', // solo eventos cambian duración
  editable: true,
}))}
        displayEventTime={true} // para mostrar la hora en eventos que tengan
        eventContent={renderEventContent}
        dateClick={handleDateClick}
        selectable={true}
        datesSet={updateTitle}
        height="auto"
        expandRows={true}
        nowIndicator={true}
        eventTimeFormat={{ // <--- mostrar hora
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        dayMaxEvents={3}
      />

    </div>
  );
};

export default Calendar;
