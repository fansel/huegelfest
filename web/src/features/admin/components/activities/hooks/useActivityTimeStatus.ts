'use client';

import { useMemo, useState, useEffect } from 'react';
import { 
  getActivityTimeStatus, 
  groupActivitiesByStatus, 
  sortActivitiesByTime,
  isActivityToday,
  isActivityStartingSoon
} from '../utils/timeUtils';
import type { 
  ActivityWithCategoryAndTemplate, 
  ActivityTimeStatus, 
  ActivityViewMode, 
  ActivityFilters 
} from '../types';

interface UseActivityTimeStatusReturn {
  // Status helpers
  getStatus: (activity: ActivityWithCategoryAndTemplate) => ActivityTimeStatus;
  isToday: (activity: ActivityWithCategoryAndTemplate) => boolean;
  isStartingSoon: (activity: ActivityWithCategoryAndTemplate, minutes?: number) => boolean;
  
  // Filtering and grouping
  filterActivities: (activities: ActivityWithCategoryAndTemplate[], filters: ActivityFilters) => ActivityWithCategoryAndTemplate[];
  groupByStatus: (activities: ActivityWithCategoryAndTemplate[]) => {
    active: ActivityWithCategoryAndTemplate[];
    upcoming: ActivityWithCategoryAndTemplate[];
    past: ActivityWithCategoryAndTemplate[];
  };
  sortByTime: (activities: ActivityWithCategoryAndTemplate[]) => ActivityWithCategoryAndTemplate[];
  
  // View mode filtering
  filterByViewMode: (activities: ActivityWithCategoryAndTemplate[], mode: ActivityViewMode) => ActivityWithCategoryAndTemplate[];
  
  // Real-time updates
  currentTime: Date;
  refreshTime: () => void;
}

export function useActivityTimeStatus(): UseActivityTimeStatusReturn {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute for real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  const refreshTime = () => {
    setCurrentTime(new Date());
  };

  const getStatus = useMemo(() => {
    return (activity: ActivityWithCategoryAndTemplate): ActivityTimeStatus => {
      return getActivityTimeStatus(activity);
    };
  }, [currentTime]); // Re-calculate when time changes

  const isToday = useMemo(() => {
    return (activity: ActivityWithCategoryAndTemplate): boolean => {
      return isActivityToday(activity);
    };
  }, [currentTime]);

  const isStartingSoon = useMemo(() => {
    return (activity: ActivityWithCategoryAndTemplate, minutes = 15): boolean => {
      return isActivityStartingSoon(activity, minutes);
    };
  }, [currentTime]);

  const filterActivities = useMemo(() => {
    return (activities: ActivityWithCategoryAndTemplate[], filters: ActivityFilters): ActivityWithCategoryAndTemplate[] => {
      return activities.filter(activity => {
        // Filter by group
        if (filters.groupId && activity.groupId !== filters.groupId) {
          return false;
        }

        // Filter by category
        if (filters.categoryId && activity.categoryId !== filters.categoryId) {
          return false;
        }

        // Filter by responsible users
        if (filters.hasResponsibleUsers !== undefined) {
          const hasResponsible = activity.responsibleUsers && activity.responsibleUsers.length > 0;
          if (filters.hasResponsibleUsers !== hasResponsible) {
            return false;
          }
        }

        // Filter by time status
        if (filters.timeStatus) {
          const status = getActivityTimeStatus(activity);
          switch (filters.timeStatus) {
            case 'active':
              if (!status.isActive) return false;
              break;
            case 'upcoming':
              if (status.hasStarted) return false;
              break;
            case 'past':
              if (!status.hasEnded) return false;
              break;
          }
        }

        return true;
      });
    };
  }, []);

  const groupByStatus = useMemo(() => {
    return (activities: ActivityWithCategoryAndTemplate[]) => {
      return groupActivitiesByStatus(activities);
    };
  }, []);

  const sortByTime = useMemo(() => {
    return (activities: ActivityWithCategoryAndTemplate[]) => {
      return sortActivitiesByTime(activities);
    };
  }, []);

  const filterByViewMode = useMemo(() => {
    return (activities: ActivityWithCategoryAndTemplate[], mode: ActivityViewMode): ActivityWithCategoryAndTemplate[] => {
      const now = new Date();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      switch (mode) {
        case 'all':
          return activities;
          
        case 'today':
          return activities.filter(activity => isActivityToday(activity));
          
        case 'upcoming':
          return activities.filter(activity => {
            const status = getActivityTimeStatus(activity);
            return !status.hasStarted;
          });
          
        case 'past':
          return activities.filter(activity => {
            const status = getActivityTimeStatus(activity);
            return status.hasEnded;
          });
          
        default:
          return activities;
      }
    };
  }, []);

  return {
    getStatus,
    isToday,
    isStartingSoon,
    filterActivities,
    groupByStatus,
    sortByTime,
    filterByViewMode,
    currentTime,
    refreshTime,
  };
} 