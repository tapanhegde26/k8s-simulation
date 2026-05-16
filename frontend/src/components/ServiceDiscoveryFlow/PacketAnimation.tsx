// DNS Query Visualization Component
// Shows DNS query/response details in an animated bubble

import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight, Server } from 'lucide-react';

interface DNSQueryBubbleProps {
  isVisible: boolean;
  type: 'query' | 'response';
  query?: string;
  response?: string;
  position: { x: number; y: number };
}

export function DNSQueryBubble({ 
  isVisible, 
  type, 
  query, 
  response, 
  position 
}: DNSQueryBubbleProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute pointer-events-none z-20"
          style={{ left: position.x, top: position.y }}
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`
            px-3 py-2 rounded-lg text-xs font-mono
            ${type === 'query' 
              ? 'bg-purple-500/90 border border-purple-400' 
              : 'bg-green-500/90 border border-green-400'
            }
            shadow-lg backdrop-blur-sm
          `}>
            <div className="flex items-center gap-2 text-white">
              {type === 'query' ? (
                <>
                  <Search size={12} />
                  <span>DNS Query</span>
                </>
              ) : (
                <>
                  <Server size={12} />
                  <span>DNS Response</span>
                </>
              )}
            </div>
            <div className="mt-1 text-white/90">
              {type === 'query' && query && (
                <div className="flex items-center gap-1">
                  <span className="text-purple-200">?</span>
                  <span>{query}</span>
                </div>
              )}
              {type === 'response' && response && (
                <div className="flex items-center gap-1">
                  <ArrowRight size={10} className="text-green-200" />
                  <span>{response}</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface IPTablesRuleDisplayProps {
  isVisible: boolean;
  chain: string;
  rule: string;
  description: string;
  position: { x: number; y: number };
}

export function IPTablesRuleDisplay({
  isVisible,
  chain,
  rule,
  description,
  position,
}: IPTablesRuleDisplayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute pointer-events-none z-20"
          style={{ left: position.x, top: position.y }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-red-900/90 border border-red-500 rounded-lg px-3 py-2 text-xs font-mono shadow-lg max-w-xs">
            <div className="text-red-300 font-semibold mb-1">
              Chain: {chain}
            </div>
            <div className="text-red-100 text-[10px] break-all">
              {rule}
            </div>
            <div className="text-red-400 text-[10px] mt-1 italic">
              {description}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ServiceIPDisplayProps {
  isVisible: boolean;
  serviceName: string;
  clusterIP: string;
  port: number;
  endpoints: { ip: string; port: number }[];
  position: { x: number; y: number };
}

export function ServiceIPDisplay({
  isVisible,
  serviceName,
  clusterIP,
  port,
  endpoints,
  position,
}: ServiceIPDisplayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute pointer-events-none z-20"
          style={{ left: position.x, top: position.y }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          <div className="bg-indigo-900/90 border border-indigo-500 rounded-lg px-3 py-2 text-xs shadow-lg">
            <div className="text-indigo-300 font-semibold mb-2">
              Service: {serviceName}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-indigo-400">ClusterIP:</span>
                <span className="text-white font-mono">{clusterIP}:{port}</span>
              </div>
              <div className="text-indigo-400 mt-2">Endpoints:</div>
              {endpoints.map((ep, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-2 text-green-300 font-mono"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <span className="text-indigo-500">→</span>
                  <span>{ep.ip}:{ep.port}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface LoadBalancerAnimationProps {
  isVisible: boolean;
  selectedPod: number;
  position: { x: number; y: number };
}

export function LoadBalancerAnimation({
  isVisible,
  selectedPod,
  position,
}: LoadBalancerAnimationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute pointer-events-none z-20"
          style={{ left: position.x, top: position.y }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="bg-orange-900/90 border border-orange-500 rounded-lg px-3 py-2 text-xs shadow-lg">
            <div className="text-orange-300 font-semibold mb-1">
              Load Balancing
            </div>
            <div className="flex gap-2">
              {[1, 2, 3].map((pod) => (
                <motion.div
                  key={pod}
                  className={`
                    w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold
                    ${selectedPod === pod 
                      ? 'bg-green-500 text-white' 
                      : 'bg-slate-600 text-slate-400'
                    }
                  `}
                  animate={selectedPod === pod ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {pod}
                </motion.div>
              ))}
            </div>
            <div className="text-orange-400 text-[10px] mt-1">
              Random selection (33% each)
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
