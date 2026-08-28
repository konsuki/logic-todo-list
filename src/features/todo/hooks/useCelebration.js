import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

export const useCelebration = (rootNodes) => {
  const [completedGoals, setCompletedGoals] = useState(new Set());

  useEffect(() => {
    rootNodes.forEach(root => {
      if (root.progress === 100 && !completedGoals.has(root.id)) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00E5FF', '#00FFAD', '#FFFFFF'],
          zIndex: 1000
        });
        setCompletedGoals(prev => new Set([...prev, root.id]));
      } else if (root.progress < 100 && completedGoals.has(root.id)) {
        setCompletedGoals(prev => {
          const next = new Set(prev);
          next.delete(root.id);
          return next;
        });
      }
    });
  }, [rootNodes, completedGoals]);

  return { completedGoals };
};
