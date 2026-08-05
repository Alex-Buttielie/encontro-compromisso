'use client';

import { type ReactNode, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Box } from '@mui/material';

interface DragListProps<T extends { id: number | string }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, index: number) => ReactNode;
  droppableId?: string;
}

/**
 * Reorderable list component powered by @hello-pangea/dnd.
 *
 * Implements the Strategy pattern: the reorder logic is encapsulated
 * and the rendering is delegated to the caller via a render prop.
 *
 * @example
 * <DragList items={tasks} onReorder={setTasks} renderItem={(task) => <TaskCard task={task} />} />
 */
export function DragList<T extends { id: number | string }>({
  items,
  onReorder,
  renderItem,
  droppableId = 'list',
}: DragListProps<T>) {
  const handleDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      if (result.destination.index === result.source.index) return;

      const reordered = Array.from(items);
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, moved);
      onReorder(reordered);
    },
    [items, onReorder]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={String(item.id)} index={index}>
                {(dragProvided) => (
                  <Box
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    sx={{ mb: 1 }}
                  >
                    {renderItem(item, index)}
                  </Box>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </Box>
        )}
      </Droppable>
    </DragDropContext>
  );
}
