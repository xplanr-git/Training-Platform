import React from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, ChevronDown, ChevronRight, Edit2, Trash2, Plus } from 'lucide-react';
import { Section, Activity } from './types';
import { DraggableActivity } from './DraggableActivity';

const ItemTypes = {
  SECTION: 'section'
};

interface DraggableSectionProps {
  section: Section;
  index: number;
  moveSection: (dragIndex: number, hoverIndex: number) => void;
  toggleSection: (sectionId: string) => void;
  editSection: (sectionId: string) => void;
  deleteSection: (sectionId: string) => void;
  moveActivity: (sectionId: string, dragIndex: number, hoverIndex: number) => void;
  getActivityIcon: (activity: Activity) => JSX.Element;
  editActivity: (sectionId: string, activityId: string) => void;
  deleteActivity: (sectionId: string, activityId: string) => void;
  addActivity: (sectionId: string) => void;
}

export function DraggableSection({ section, index, moveSection, toggleSection, editSection, deleteSection, moveActivity, getActivityIcon, editActivity, deleteActivity, addActivity }: DraggableSectionProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ItemTypes.SECTION,
    item: { id: section.id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [, drop] = useDrop({
    accept: ItemTypes.SECTION,
    hover: (item: { id: string; index: number }) => {
      if (item.index === index) return;

      moveSection(item.index, index);
      item.index = index;
    }
  });

  return (
    <div
      ref={(node) => preview(drop(node))}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="bg-white rounded-lg border border-gray-200 shadow-sm"
    >
      {/* Section Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200">
        <button ref={drag} className="text-gray-400 hover:text-gray-600 cursor-move">
          <GripVertical className="size-5" />
        </button>
        <div 
          className="flex-1 flex items-center gap-3 cursor-pointer"
          onClick={() => toggleSection(section.id)}
        >
          <div className="flex items-center justify-center size-10 bg-gray-100 rounded-lg">
            <span className="text-lg font-bold text-gray-900">{String(index + 1).padStart(2, '0')}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{section.title}</h3>
              {section.isFree && (
                <span className="px-2 py-1 bg-teal-100 text-teal-700 text-xs font-medium rounded">
                  Free
                </span>
              )}
            </div>
          </div>
          {section.isExpanded ? (
            <ChevronDown className="size-5 text-gray-400" />
          ) : (
            <ChevronRight className="size-5 text-gray-400" />
          )}
        </div>
        <button 
          className="text-gray-400 hover:text-gray-600 p-1"
          onClick={(e) => {
            e.stopPropagation();
            editSection(section.id);
          }}
        >
          <Edit2 className="size-4" />
        </button>
        <button 
          className="text-gray-400 hover:text-red-600 p-1"
          onClick={(e) => {
            e.stopPropagation();
            deleteSection(section.id);
          }}
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {/* Activities */}
      {section.isExpanded && (
        <div className="p-4">
          {section.activities.length > 0 ? (
            <div className="space-y-2 mb-4">
              {section.activities.map((activity, activityIndex) => (
                <DraggableActivity
                  key={activity.id}
                  activity={activity}
                  sectionId={section.id}
                  index={activityIndex}
                  moveActivity={moveActivity}
                  getActivityIcon={getActivityIcon}
                  editActivity={editActivity}
                  deleteActivity={deleteActivity}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No activities yet. Add your first activity below.
            </div>
          )}

          {/* Add Activity Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button 
              onClick={() => addActivity(section.id)}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
            >
              <Plus className="size-4" />
              Add activity
            </button>
          </div>
        </div>
      )}
    </div>
  );
}