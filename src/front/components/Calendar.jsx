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
    { title: 'Reunión', start: '2025-09-10T10:00:00', end: '2025-09-10T11:00:00', type: 'event', calendarId: 'trabajo' },
    { title: 'Cumpleaños', start: '2025-09-15', type: 'event', calendarId: 'cumpleaños' },
    { title: 'Comprar comida', start: '2025-09-12', type: 'task', groupId: 'hogar' },
    { title: 'Enviar informe', start: '2025-09-13', type: 'task', groupId: 'trabajo' },
  ]);

  const [title, setTitle] = useState('');

  const handleDateClick = (arg) => {
    const titleInput = prompt('Introduce el título:');
    if (!titleInput) return;

    const type = prompt('Tipo: "event" o "task"?');
    if (type === 'event') {
      const calendarId = prompt('Calendario: trabajo, personal o cumpleaños');
      if (!calendars[calendarId]) return alert('Calendario no válido');
      setItems([...items, { title: titleInput, start: arg.date, allDay: arg.allDay, type, calendarId }]);
    } else if (type === 'task') {
      const groupId = prompt('Grupo de tareas: hogar o trabajo');
      if (!taskGroups[groupId]) return alert('Grupo no válido');
      setItems([...items, { title: titleInput, start: arg.date, allDay: arg.allDay, type, groupId }]);
    } else {
      alert('Tipo no válido');
    }
  };

  // Toolbar personalizada
  const goPrev = () => { calendarRef.current?.getApi().prev(); updateTitle(); };
  const goNext = () => { calendarRef.current?.getApi().next(); updateTitle(); };
  const goToday = () => { calendarRef.current?.getApi().today(); updateTitle(); };
  const handleViewChange = (e) => { calendarRef.current?.getApi().changeView(e.target.value); updateTitle(); };
  const updateTitle = () => { setTitle(calendarRef.current?.getApi().view.title || ''); };

  return (
    <div>
      {/* Mi toolbar personalizada */}
      <div className="custom-toolbar">
      <div className="left-controls">
  <button onClick={goPrev} className="fc-button fc-button-primary fc-icon fc-icon-chevron-left" />
  <button onClick={goToday} className="fc-button fc-button-primary">Hoy</button>
  <button onClick={goNext} className="fc-button fc-button-primary fc-icon fc-icon-chevron-right" />
</div>

        <div className="center-title">{title}</div>
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
        headerToolbar={false}  // Desactivamos completamente la toolbar de FullCalendar
        footerToolbar={false}  // Desactivamos el footer también
        events={items.map(item => {
          if (item.type === 'event') {
            return {
              ...item,
              backgroundColor: calendars[item.calendarId]?.background,
              borderColor: calendars[item.calendarId]?.border,
              textColor: calendars[item.calendarId]?.text,
              display: 'block',
            };
          } else {
            return {
              ...item,
              backgroundColor: taskGroups[item.groupId]?.background,
              borderColor: taskGroups[item.groupId]?.border,
              textColor: taskGroups[item.groupId]?.text,
            };
          }
        })}
        
        
        dateClick={handleDateClick}
        editable={true}
        selectable={true}
        datesSet={updateTitle} 
        height="auto"
        expandRows={true}
        nowIndicator={true}
      />
    </div>
  );
};

export default Calendar;
