'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';

export default function ScheduleModal({ isOpen, schedule, onClose, onSave }) {
  const [localSchedule, setLocalSchedule] = useState(schedule);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Schedule Automatic Backups</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/20 transition-colors">
            <X className="h-5 w-5 text-muted" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-sm font-medium text-foreground">Enable Automatic Backups</span>
            <button
              onClick={() => setLocalSchedule({ ...localSchedule, enabled: !localSchedule.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                localSchedule.enabled ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  localSchedule.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>
          
          {localSchedule.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Frequency</label>
                <select
                  value={localSchedule.frequency}
                  onChange={(e) => setLocalSchedule({ ...localSchedule, frequency: e.target.value })}
                  className="input-field"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Time (UTC)</label>
                <input
                  type="time"
                  value={localSchedule.time}
                  onChange={(e) => setLocalSchedule({ ...localSchedule, time: e.target.value })}
                  className="input-field"
                />
              </div>
            </>
          )}
        </div>
        
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => onSave(localSchedule.enabled, localSchedule.frequency, localSchedule.time)}>
            Save Schedule
          </Button>
        </div>
      </div>
    </div>
  );
}