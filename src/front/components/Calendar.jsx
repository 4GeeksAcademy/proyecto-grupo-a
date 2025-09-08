import React, { useRef, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';

const Calendar = () => {
  const calendarRef = useRef(null);
  const [events, setEvents] = useState([
    { title: 'Reunión', start: '2025-09-10T10:00:00', end: '2025-09-10T11:00:00' },
    { title: 'Entrega proyecto', start: '2025-09-12' },
    { title: 'Cumpleaños', start: '2025-09-15' },
  ]);
  const [title, setTitle] = useState('');

  const handleDateClick = (arg) => {
    const title = prompt('Introduce el título del evento:');
    if (title) {
      setEvents([...events, { title, start: arg.date, allDay: arg.allDay }]);
    }
  };

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
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      setTitle(calendarApi.view.title);
    }
  };
  

  return (
<div>
      {/* Barra superior personalizada */}
      <div className="custom-toolbar">
        <div className="left-controls">
          <button onClick={goPrev} className="fc-icon fc-icon-chevron-left" />
          <button onClick={goToday}>Hoy</button>
          <button onClick={goNext} className="fc-icon fc-icon-chevron-right" />
        </div>
        <div className="center-title">{title}</div>
        <div className="right-controls">
          <select onChange={handleViewChange} className="view-select">
            <option value="dayGridMonth">Mes</option>
            <option value="timeGridWeek">Semana</option>
          </select>
        </div>
      </div>

     <FullCalendar
    ref={calendarRef}
    contentHeight="auto"
    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
    initialView="dayGridMonth"
    locale={esLocale}
    headerToolbar={false}
    events={events}
    dateClick={handleDateClick}
    editable={true}
    selectable={true}
    datesSet={updateTitle}
    height="auto"       // importante
    expandRows={true}   // importante para que las filas se expandan
    nowIndicator="true"
  />
    </div>
  );
};

export default Calendar;
