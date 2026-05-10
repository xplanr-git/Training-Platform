import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, Clock, FileText, Edit2, Trash2 } from 'lucide-react';
import { Activity } from './types';

const ItemTypes = {
  ACTIVITY: 'activity'
};

interface DraggableActivityProps {
  activity: Activity;
  sectionId: string;
  index: number;
  moveActivity: (sectionId: string, dragIndex: number, hoverIndex: number) => void;
  getActivityIcon: (activity: Activity) => JSX.Element;
  editActivity: (sectionId: string, activityId: string) => void;
  deleteActivity: (sectionId: string, activityId: string) => void;
}

export function DraggableActivity({ activity, sectionId, index, moveActivity, getActivityIcon, editActivity, deleteActivity }: DraggableActivityProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.ACTIVITY,
    item: { id: activity.id, index, sectionId },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [, drop] = useDrop({
    accept: ItemTypes.ACTIVITY,
    hover: (item: { id: string; index: number; sectionId: string }) => {
      if (item.sectionId !== sectionId) return;
      if (item.index === index) return;

      moveActivity(sectionId, item.index, index);
      item.index = index;
    }
  });

  return (
    <div
      ref={(node) => preview(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
    >
      <button ref={drag} className="text-gray-400 hover:text-gray-600 cursor-move">
        <GripVertical className="size-4" />
      </button>
      <div className="text-gray-600">
        {getActivityIcon(activity)}
      </div>
      <div className="flex-1">
        <div className="font-medium text-gray-900">{activity.title}</div>
        {activity.duration && activity.duration !== '00:00' && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
            <Clock className="size-3" />
            {activity.duration}
          </div>
        )}
        {activity.pageCount && (
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-0.5">
            <FileText className="size-3" />
            {activity.pageCount} {activity.pageCount === 1 ? 'page' : 'pages'}
          </div>
        )}
      </div>
      <button 
        className="text-gray-400 hover:text-gray-600 p-1"
        onClick={() => editActivity(sectionId, activity.id)}
      >
        <Edit2 className="size-4" />
      </button>
      <button 
        className="text-gray-400 hover:text-red-600 p-1"
        onClick={() => deleteActivity(sectionId, activity.id)}
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}