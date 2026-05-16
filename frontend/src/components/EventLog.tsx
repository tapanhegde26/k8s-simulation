import { useK8sStore } from '../store/k8sStore';
import { Activity, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function EventLog() {
  const { events } = useK8sStore();

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h3 className="font-semibold flex items-center gap-2">
          <Activity size={18} className="text-k8s-blue" />
          Event Log
        </h3>
        <p className="text-xs text-slate-400 mt-1">Real-time cluster events</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <AnimatePresence>
          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No events yet</p>
              <p className="text-xs">Events will appear here as you interact with the cluster</p>
            </div>
          ) : (
            events.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={`
                  p-3 rounded-lg border-l-2 text-sm
                  ${event.type === 'Normal' 
                    ? 'bg-slate-800/50 border-green-500' 
                    : 'bg-red-500/10 border-red-500'}
                `}
              >
                <div className="flex items-start gap-2">
                  {event.type === 'Normal' ? (
                    <CheckCircle size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <AlertCircle size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-1.5 py-0.5 bg-slate-700 rounded text-slate-300">
                        {event.reason}
                      </span>
                      <span className="text-xs text-slate-500">
                        {event.involvedObject.kind}/{event.involvedObject.name}
                      </span>
                    </div>
                    <p className="text-slate-300 mt-1 break-words">{event.message}</p>
                    <span className="text-xs text-slate-500 mt-1 block">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
