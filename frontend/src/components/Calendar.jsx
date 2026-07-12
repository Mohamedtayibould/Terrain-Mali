import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FiChevronLeft, FiChevronRight, FiClock } from 'react-icons/fi';

export default function Calendar({ slots, selectedDate, onDateSelect, selectedSlot, onSlotSelect }) {
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [viewMonth, setViewMonth] = useState(new Date());

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const prevWeek = () => setWeekStart(addDays(weekStart, -7));
  const nextWeek = () => setWeekStart(addDays(weekStart, 7));

  return (
    <div>
      {/* Week navigator */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevWeek} className="p-2 hover:bg-gray-100 rounded-lg">
          <FiChevronLeft />
        </button>
        <h3 className="font-semibold text-gray-800">
          {format(days[0], 'dd MMM', { locale: fr })} - {format(days[6], 'dd MMM yyyy', { locale: fr })}
        </h3>
        <button onClick={nextWeek} className="p-2 hover:bg-gray-100 rounded-lg">
          <FiChevronRight />
        </button>
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {days.map((day) => {
          const isPast = isBefore(day, today);
          const isSelected = selectedDate && isSameDay(day, new Date(selectedDate));
          const dayName = format(day, 'EEE', { locale: fr });
          const dayNum = format(day, 'dd');

          return (
            <button
              key={day.toISOString()}
              onClick={() => !isPast && onDateSelect(format(day, 'yyyy-MM-dd'))}
              disabled={isPast}
              className={`flex flex-col items-center py-3 rounded-lg transition-all ${
                isPast
                  ? 'text-gray-300 cursor-not-allowed'
                  : isSelected
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'hover:bg-orange-50 text-gray-700'
              }`}
            >
              <span className="text-xs capitalize">{dayName}</span>
              <span className="text-lg font-bold">{dayNum}</span>
            </button>
          );
        })}
      </div>

      {/* Time slots */}
      {selectedDate && slots && slots.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <FiClock className="text-orange-600" />
            Creneaux disponibles
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {slots.map((slot, idx) => {
              const slotKey = `${format(new Date(selectedDate), 'yyyy-MM-dd')}-${slot.slot_start}`;
              const isSelected = selectedSlot?.slot_start === slot.slot_start;

              return (
                <button
                  key={idx}
                  onClick={() => slot.is_available && onSlotSelect(slot)}
                  disabled={!slot.is_available}
                  className={`py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                    !slot.is_available
                      ? 'bg-red-100 text-red-500 cursor-not-allowed line-through'
                      : isSelected
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  <span className="block">{slot.slot_start?.substring(0, 5)}</span>
                  <span className="text-xs">
                    {slot.is_available ? 'Disponible' : 'Reserve'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && slots && slots.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <FiClock className="mx-auto text-3xl mb-2 text-gray-300" />
          <p>Chargement des creneaux...</p>
        </div>
      )}
    </div>
  );
}
