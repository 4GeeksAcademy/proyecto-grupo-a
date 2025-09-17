// src/front/pages/EventosTareas.jsx
import React, { useMemo } from "react";
import TablaEventos from "../components/TablaEventos";
import Tasks from "../components/Tasks";
import useGlobalReducer from "../hooks/useGlobalReducer.jsx";

export const EventosTareas = () => {
  const { store } = useGlobalReducer();

  // Adaptar eventos del store al formato que espera TablaEventos:
  // { id, title, start_date, end_date, color }
  const eventosForTable = useMemo(() => {
    return (store.events || []).map((e) => ({
      id: e.id,
      title: e.title,
      start_date: e.startDate, // TablaEventos espera start_date
      end_date: e.endDate,     // TablaEventos espera end_date
      color: e.color || undefined,
    }));
  }, [store.events]);

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna izquierda: Eventos */}
        <div>
          <TablaEventos eventos={eventosForTable} />
        </div>

        {/* Columna derecha: Tareas */}
        <div>
          <Tasks />
        </div>
      </div>
    </div>
  );
};

export default EventosTareas;
