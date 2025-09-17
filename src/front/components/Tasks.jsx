import { useState, useEffect } from 'react';
import TasksSection from './TasksSection';
import TaskItem from './TaskItem';

// Usa las APIs centralizadas con token
import {
  apiListTasks,
  apiCreateTask,
  apiUpdateTask,
  apiDeleteTask,
} from '../lib/api';

export default function Tasks() {
  // Estado para las tareas obtenidas de la API
  const [tasks, setTasks] = useState({
    atrasado: [],
    conFecha: {},
    sinFecha: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Variable de estado que controla si es visible o no
  const [showFilterPopup, setShowFilterPopup] = useState(false);
  // Variable de estado que controla si están marcados los checkbox
  const [activeFilters, setActiveFilters] = useState({
    atrasado: true,
    conFecha: true,
    sinFecha: true
  });

  // -------- Helpers --------
  const parseDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const formatDate = (date) => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    const dia = dias[date.getDay()];
    const numeroDate = date.getDate();
    const mes = meses[date.getMonth()];

    return `${dia}, ${numeroDate} de ${mes}`;
  };

  // Procesar y categorizar las tareas usando el contrato del backend (/api/tasks)
  const processTasks = (apiTasks) => {
    const now = new Date();
    const categorizedTasks = {
      atrasado: [],
      conFecha: {},
      sinFecha: [],
    };

    (apiTasks || []).forEach(task => {
      const statusBool = !!task.status; // backend envía boolean
      const mapped = {
        id: task.id,
        text: task.title,
        color: task.color || "text-gray-600",
        repeat: task.recurrencia != null, // bool visual
        status: statusBool,               // <-- booleano
        date: task.date || null
      };

      if (task.date) {
        const taskDate = parseDate(task.date);
        if (!taskDate) {
          // Si la fecha es inválida, trátala como sin fecha
          categorizedTasks.sinFecha.push(mapped);
          return;
        }

        // Tareas vencidas: fecha pasada y no completadas
        if (taskDate < now && statusBool === false) {
          categorizedTasks.atrasado.push(mapped);
        } else {
          const key = formatDate(taskDate);
          if (!categorizedTasks.conFecha[key]) categorizedTasks.conFecha[key] = [];
          categorizedTasks.conFecha[key].push(mapped);
        }
      } else {
        // Tareas sin fecha
        categorizedTasks.sinFecha.push(mapped);
      }
    });

    return categorizedTasks;
  };

  // -------- API --------
  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      // Puedes pasar rango si lo deseas: apiListTasks({ start, end })
      const apiTasks = await apiListTasks();
      const processed = processTasks(apiTasks);
      setTasks(processed);
    } catch (err) {
      console.error('Error al obtener tareas:', err);
      setError(err.message || 'No se pudieron cargar las tareas');
    } finally {
      setLoading(false);
    }
  };

  const createTask = async (taskData) => {
    try {
      await apiCreateTask(taskData);
      await fetchTasks();
    } catch (err) {
      console.error('Error al crear tarea:', err);
      setError(err.message || 'No se pudo crear la tarea');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await apiDeleteTask(taskId);
      await fetchTasks();
    } catch (err) {
      console.error('Error al eliminar tarea:', err);
      setError(err.message || 'No se pudo eliminar la tarea');
    }
  };

  const updateTask = async (taskId, updateData) => {
    try {
      await apiUpdateTask(taskId, updateData);
      await fetchTasks();
    } catch (err) {
      console.error('Error al actualizar tarea:', err);
      setError(err.message || 'No se pudo actualizar la tarea');
    }
  };

  // Cargar tareas al montar el componente
  useEffect(() => {
    fetchTasks();
  }, []);

  // -------- Filtros --------
  const toggleFilter = (filterType) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      atrasado: false,
      conFecha: false,
      sinFecha: false
    });
  };

  const selectAllFilters = () => {
    setActiveFilters({
      atrasado: true,
      conFecha: true,
      sinFecha: true
    });
  };

  // -------- UI --------
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tareas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error al cargar tareas: {error}</p>
          <button
            onClick={fetchTasks}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-4 border-gray-400">
      {/* Encabezado */}
      <div className="relative w-full max-w-lg mb-4 flex items-center">
        <h1 className="text-2xl font-bold mx-auto">Tareas</h1>
        <button
          onClick={() => setShowFilterPopup(true)}
          className="absolute right-0 top-3 text-sky-600 text-sm hover:text-sky-800 transition-colors"
        >
          Filtrar
        </button>
      </div>

      {/* Contenedor general */}
      <div className="w-full max-w-2xl border border-gray-300 shadow-md rounded-2xl bg-white p-10 space-y-20">
        {/* Sección Atrasado */}
        {activeFilters.atrasado && (
          <TasksSection title="Atrasado">
            {tasks.atrasado.map((task) => (
              <TaskItem
                key={task.id}
                id={task.id}
                text={task.text}
                color={task.color}
                repeat={task.repeat}
                status={task.status} // booleano
                onDelete={() => deleteTask(task.id)}
                onUpdate={(patch) => updateTask(task.id, patch)}
              />
            ))}
          </TasksSection>
        )}

        {/* Sección con fecha */}
        <div>
          {activeFilters.conFecha && Object.entries(tasks.conFecha).map(([date, taskList]) => (
            <TasksSection key={date} title={date}>
              {taskList.map((task) => (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  text={task.text}
                  color={task.color}
                  repeat={task.repeat}
                  status={task.status} // booleano
                  onDelete={() => deleteTask(task.id)}
                  onUpdate={(patch) => updateTask(task.id, patch)}
                />
              ))}
            </TasksSection>
          ))}
        </div>

        {/* Sección Sin fecha */}
        {activeFilters.sinFecha && (
          <TasksSection title="Sin fecha">
            {tasks.sinFecha.length > 0 ? (
              tasks.sinFecha.map((task) => (
                <TaskItem
                  key={task.id}
                  id={task.id}
                  text={task.text}
                  color={task.color}
                  repeat={task.repeat}
                  status={task.status} // booleano
                  onDelete={() => deleteTask(task.id)}
                  onUpdate={(patch) => updateTask(task.id, patch)}
                />
              ))
            ) : (
              <div className="text-gray-400 text-sm p-4">No hay tareas</div>
            )}
          </TasksSection>
        )}

        {/* Mensaje cuando no hay filtros activos */}
        {!activeFilters.atrasado && !activeFilters.conFecha && !activeFilters.sinFecha && (
          <div className="text-center text-gray-400 py-8">
            <p className="text-lg">No hay filtros seleccionados</p>
            <p className="text-sm">Usa el botón "Filtrar" para mostrar tareas</p>
          </div>
        )}
      </div>

      {/* Popup de Filtros */}
      {showFilterPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Filtrar Tareas</h3>
              <button
                onClick={() => setShowFilterPopup(false)}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Opción Atrasado */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeFilters.atrasado}
                  onChange={() => toggleFilter('atrasado')}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <span className="text-gray-700">Tareas Atrasadas</span>
                <span className="ml-auto text-sm text-gray-500">({tasks.atrasado.length})</span>
              </label>

              {/* Opción Con Fecha */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeFilters.conFecha}
                  onChange={() => toggleFilter('conFecha')}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="text-gray-700">Tareas con Fecha</span>
                <span className="ml-auto text-sm text-gray-500">
                  ({Object.values(tasks.conFecha).flat().length})
                </span>
              </label>

              {/* Opción Sin Fecha */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeFilters.sinFecha}
                  onChange={() => toggleFilter('sinFecha')}
                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-gray-700">Tareas sin Fecha</span>
                <span className="ml-auto text-sm text-gray-500">({tasks.sinFecha.length})</span>
              </label>
            </div>

            {/* Botones de acción */}
            <div className="flex space-x-3 mt-6">
              <button
                onClick={clearAllFilters}
                className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Limpiar Todo
              </button>
              <button
                onClick={selectAllFilters}
                className="flex-1 px-4 py-2 text-white bg-sky-600 rounded-lg hover:bg-sky-700 transition-colors"
              >
                Seleccionar Todo
              </button>
            </div>

            <button
              onClick={() => setShowFilterPopup(false)}
              className="w-full mt-3 px-4 py-2 text-sky-600 font-medium hover:bg-sky-50 rounded-lg transition-colors"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Estilos CSS personalizados */}
      <style>{`
        .circular-checkbox {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid;
          background-color: white;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
        }
        
        .circular-checkbox:checked {
          background-color: currentColor;
        }
        
        .circular-checkbox:checked::after {
          content: '';
          position: absolute;
          color: white;
          font-size: 12px;
          font-weight: bold;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        
        .circular-checkbox:hover {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
