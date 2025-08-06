import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const OrganizationalTree = ({ 
  sites, 
  supervisors, 
  onNodeSelect, 
  selectedNode,
  onDragDrop,
  userRole = 'admin'
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
  const [draggedItem, setDraggedItem] = useState(null);

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded?.has(nodeId)) {
      newExpanded?.delete(nodeId);
    } else {
      newExpanded?.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleDragStart = (e, item, type) => {
    if (userRole !== 'admin') return;
    setDraggedItem({ item, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e?.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetItem, targetType) => {
    e?.preventDefault();
    if (!draggedItem || userRole !== 'admin') return;
    
    if (draggedItem?.type !== targetType) {
      onDragDrop(draggedItem, { item: targetItem, type: targetType });
    }
    setDraggedItem(null);
  };

  const TreeNode = ({ 
    id, 
    label, 
    icon, 
    type, 
    data, 
    children, 
    level = 0,
    isExpandable = false,
    count = null
  }) => {
    const isExpanded = expandedNodes?.has(id);
    const isSelected = selectedNode?.id === id && selectedNode?.type === type;
    const isDragging = draggedItem?.item?.id === data?.id;

    return (
      <div className="select-none">
        <div
          className={`
            flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-all duration-150 ease-out-cubic
            ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
            ${isDragging ? 'opacity-50' : ''}
          `}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          onClick={() => onNodeSelect({ id, type, data })}
          draggable={userRole === 'admin' && data}
          onDragStart={(e) => handleDragStart(e, data, type)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, data, type)}
        >
          {isExpandable && (
            <Button
              variant="ghost"
              size="icon"
              className="w-4 h-4 p-0"
              onClick={(e) => {
                e?.stopPropagation();
                toggleNode(id);
              }}
            >
              <Icon 
                name={isExpanded ? 'ChevronDown' : 'ChevronRight'} 
                size={12} 
              />
            </Button>
          )}
          
          {!isExpandable && <div className="w-4" />}
          
          <Icon 
            name={icon} 
            size={16} 
            className={isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}
          />
          
          <span className={`text-sm font-medium ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`}>
            {label}
          </span>
          
          {count !== null && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isSelected 
                ? 'bg-primary-foreground/20 text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}>
              {count}
            </span>
          )}
        </div>
        {isExpandable && isExpanded && children && (
          <div className="ml-2">
            {children}
          </div>
        )}
      </div>
    );
  };

  const groupedData = sites?.reduce((acc, site) => {
    const supervisorId = site?.supervisor?.id || 'unassigned';
    if (!acc?.[supervisorId]) {
      acc[supervisorId] = [];
    }
    acc?.[supervisorId]?.push(site);
    return acc;
  }, {});

  return (
    <div className="bg-card border border-border rounded-lg p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Estructura Organizacional</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpandedNodes(new Set(['root', ...supervisors.map(s => s.id)]))}
          iconName="Expand"
          iconPosition="left"
        >
          Expandir todo
        </Button>
      </div>
      <div className="space-y-1">
        <TreeNode
          id="root"
          label="AsistenciaPro"
          icon="Building"
          type="root"
          isExpandable={true}
          count={sites?.length}
        >
          {/* Supervisors with their sites */}
          {supervisors?.map(supervisor => (
            <TreeNode
              key={supervisor?.id}
              id={supervisor?.id}
              label={supervisor?.name}
              icon="UserCheck"
              type="supervisor"
              data={supervisor}
              level={1}
              isExpandable={groupedData?.[supervisor?.id]?.length > 0}
              count={groupedData?.[supervisor?.id]?.length || 0}
            >
              {groupedData?.[supervisor?.id]?.map(site => (
                <TreeNode
                  key={site?.id}
                  id={site?.id}
                  label={site?.name}
                  icon="Building2"
                  type="site"
                  data={site}
                  level={2}
                  count={site?.employeeCount}
                />
              ))}
            </TreeNode>
          ))}

          {/* Unassigned sites */}
          {groupedData?.unassigned?.length > 0 && (
            <TreeNode
              id="unassigned"
              label="Sitios sin supervisor"
              icon="AlertTriangle"
              type="unassigned"
              level={1}
              isExpandable={true}
              count={groupedData?.unassigned?.length}
            >
              {groupedData?.unassigned?.map(site => (
                <TreeNode
                  key={site?.id}
                  id={site?.id}
                  label={site?.name}
                  icon="Building2"
                  type="site"
                  data={site}
                  level={2}
                  count={site?.employeeCount}
                />
              ))}
            </TreeNode>
          )}
        </TreeNode>
      </div>
      {userRole === 'admin' && (
        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Icon name="Info" size={12} />
            <span>Arrastra y suelta para reorganizar la estructura</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationalTree;