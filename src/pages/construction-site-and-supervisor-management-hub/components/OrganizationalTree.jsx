import React, { useCallback, useMemo, useRef, useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const OrganizationalTree = ({
  sites = [],
  supervisors = [],
  onNodeSelect,
  selectedNode,
  onDragDrop,
  userRole = 'admin',
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set(['root']));
  const [draggedItem, setDraggedItem] = useState(null);
  const [search, setSearch] = useState('');

  const treeRef = useRef(null);

  // --- Helpers ---
  const toggleNode = useCallback((nodeId) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  // Combinaciones de drop permitidas (ajústalas a tu lógica)
  const canDrop = useCallback((dragType, dropType) => {
    // Reglas comunes:
    if (dragType === dropType) return false;

    // Mover sitio a supervisor o a "unassigned"
    if (dragType === 'site' && (dropType === 'supervisor' || dropType === 'unassigned')) return true;

    // (Opcional) mover supervisor dentro de root (para reordenar):
    if (dragType === 'supervisor' && dropType === 'root') return true;

    return false;
  }, []);

  const handleDragStart = (e, item, type) => {
    if (userRole !== 'admin') return;
    setDraggedItem({ item, type });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetType) => {
    if (!draggedItem || userRole !== 'admin') return;
    if (!canDrop(draggedItem?.type, targetType)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetItem, targetType) => {
    e?.preventDefault?.();
    if (!draggedItem || userRole !== 'admin') return;
    if (!canDrop(draggedItem?.type, targetType)) return;
    onDragDrop?.(draggedItem, { item: targetItem, type: targetType });
    setDraggedItem(null);
  };

  // --- Filtro de búsqueda ---
  const normalizedSearch = search.trim().toLowerCase();
  const filteredSupervisors = useMemo(() => {
    if (!normalizedSearch) return supervisors;
    return supervisors.filter(
      (s) =>
        (s?.name || s?.full_name || '')
          .toLowerCase()
          .includes(normalizedSearch) ||
        (s?.email || '').toLowerCase().includes(normalizedSearch)
    );
  }, [supervisors, normalizedSearch]);

  // Agrupamos sitios por supervisorId; si no existe, van a "unassigned"
  const groupedData = useMemo(() => {
    const acc = {};
    const passSearch = (txt = '') =>
      !normalizedSearch || String(txt).toLowerCase().includes(normalizedSearch);

    (sites || []).forEach((site) => {
      // Si hay búsqueda, filtra por nombre/ubicación del sitio también
      if (
        normalizedSearch &&
        !(
          passSearch(site?.name) ||
          passSearch(site?.location) ||
          passSearch(site?.code)
        )
      ) {
        // igual puede aparecer si su supervisor matchea búsqueda, así que no lo excluimos aquí
        // dejamos que el match de supervisor lo muestre si corresponde
      }

      const sid = site?.supervisor?.id || 'unassigned';
      if (!acc[sid]) acc[sid] = [];
      acc[sid].push(site);
    });

    // Si hay búsqueda solo por supervisor, filtramos por los supervisores que matchean
    if (normalizedSearch) {
      const allowedSupervisorIds = new Set(filteredSupervisors.map((s) => s?.id));
      // Mantén unassigned siempre que haya sitios que individualmente hagan match por nombre/ubicación
      const filtered = {};
      Object.entries(acc).forEach(([supId, list]) => {
        if (supId === 'unassigned') {
          filtered[supId] = list.filter(
            (site) =>
              passSearch(site?.name) ||
              passSearch(site?.location) ||
              passSearch(site?.code)
          );
          if (filtered[supId].length === 0) delete filtered[supId];
        } else if (allowedSupervisorIds.has(supId)) {
          // Si el supervisor matchea, dejamos todos sus sitios
          filtered[supId] = list;
        } else {
          // Si el supervisor NO matchea, mostramos solo los sitios que por sí mismos matcheen
          const onlyMatchingSites = list.filter(
            (site) =>
              passSearch(site?.name) ||
              passSearch(site?.location) ||
              passSearch(site?.code)
          );
          if (onlyMatchingSites.length > 0) filtered[supId] = onlyMatchingSites;
        }
      });
      return filtered;
    }

    return acc;
  }, [sites, filteredSupervisors, normalizedSearch]);

  // Expandir/Colapsar todo
  const expandAll = () => {
    const allIds = ['root', ...filteredSupervisors.map((s) => s?.id)];
    setExpandedNodes(new Set(allIds));
  };
  const collapseAll = () => setExpandedNodes(new Set(['root']));

  // --- TreeNode ---
  const TreeNode = ({
    id,
    label,
    icon,
    type,
    data,
    children,
    level = 0,
    isExpandable = false,
    count = null,
  }) => {
    const isExpanded = expandedNodes.has(id);
    const isSelected = selectedNode?.id === id && selectedNode?.type === type;
    const isDragging = draggedItem?.item?.id === data?.id;

    const onKeyDown = (e) => {
      // Accesibilidad de árbol
      if (e.key === 'ArrowRight' && isExpandable && !isExpanded) {
        e.preventDefault();
        toggleNode(id);
      } else if (e.key === 'ArrowLeft' && isExpandable && isExpanded) {
        e.preventDefault();
        toggleNode(id);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onNodeSelect?.({ id, type, data });
      }
    };

    return (
      <div role="treeitem" aria-expanded={!!isExpandable ? isExpanded : undefined}>
        <div
          className={`
            flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-all duration-150 ease-out-cubic outline-none
            ${isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}
            ${isDragging ? 'opacity-50' : ''}
          `}
          style={{ paddingLeft: `${level * 20 + 8}px` }}
          tabIndex={0}
          onKeyDown={onKeyDown}
          onClick={() => onNodeSelect?.({ id, type, data })}
          draggable={userRole === 'admin' && !!data}
          onDragStart={(e) => handleDragStart(e, data, type)}
          onDragOver={(e) => handleDragOver(e, type)}
          onDrop={(e) => handleDrop(e, data, type)}
        >
          {isExpandable ? (
            <Button
              variant="ghost"
              size="icon"
              className="w-4 h-4 p-0"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(id);
              }}
              aria-label={isExpanded ? 'Colapsar' : 'Expandir'}
              title={isExpanded ? 'Colapsar' : 'Expandir'}
            >
              <Icon name={isExpanded ? 'ChevronDown' : 'ChevronRight'} size={12} />
            </Button>
          ) : (
            <div className="w-4" />
          )}

          <Icon
            name={icon}
            size={16}
            className={isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}
          />

          <span
            className={`text-sm font-medium ${
              isSelected ? 'text-primary-foreground' : 'text-foreground'
            }`}
          >
            {label}
          </span>

          {count !== null && (
            <span
              className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                isSelected
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {count}
            </span>
          )}
        </div>

        {isExpandable && isExpanded && children && <div className="ml-2">{children}</div>}
      </div>
    );
  };

  const totalSites = sites?.length || 0;
  const unassigned = groupedData?.unassigned || [];

  return (
    <div className="bg-card border border-border rounded-lg p-4 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Estructura Organizacional</h3>
        <div className="flex items-center gap-2">
          <input
            type="search"
            placeholder="Buscar supervisor o sitio…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-2 py-1 text-sm border border-border rounded"
            aria-label="Buscar en árbol"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={expandAll}
            iconName="Expand"
            iconPosition="left"
            title="Expandir todo"
          >
            Expandir
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={collapseAll}
            iconName="Minimize2"
            iconPosition="left"
            title="Colapsar todo"
          >
            Colapsar
          </Button>
        </div>
      </div>

      {/* Árbol */}
      <div role="tree" ref={treeRef} className="space-y-1">
        <TreeNode
          id="root"
          label="AsistenciaPro"
          icon="Building"
          type="root"
          isExpandable={true}
          count={totalSites}
        >
          {/* Supervisores con sus sitios */}
          {filteredSupervisors.length > 0 ? (
            filteredSupervisors.map((supervisor) => {
              const sitesUnder = groupedData?.[supervisor?.id] || [];
              const supLabel = supervisor?.name || supervisor?.full_name || 'Supervisor';
              return (
                <TreeNode
                  key={supervisor?.id}
                  id={supervisor?.id}
                  label={supLabel}
                  icon="UserCheck"
                  type="supervisor"
                  data={supervisor}
                  level={1}
                  isExpandable={(sitesUnder?.length || 0) > 0}
                  count={sitesUnder?.length || 0}
                >
                  {sitesUnder.map((site) => (
                    <TreeNode
                      key={site?.id}
                      id={site?.id}
                      label={site?.name}
                      icon="Building2"
                      type="site"
                      data={site}
                      level={2}
                      count={site?.employeeCount ?? null}
                    />
                  ))}
                </TreeNode>
              );
            })
          ) : (
            <div className="px-3 py-2 text-xs text-muted-foreground">
              {normalizedSearch ? 'Sin coincidencias para la búsqueda' : 'Sin supervisores'}
            </div>
          )}

          {/* Sitios sin supervisor */}
          {unassigned?.length > 0 && (
            <TreeNode
              id="unassigned"
              label="Sitios sin supervisor"
              icon="AlertTriangle"
              type="unassigned"
              level={1}
              isExpandable={true}
              count={unassigned?.length}
            >
              {unassigned.map((site) => (
                <TreeNode
                  key={site?.id}
                  id={site?.id}
                  label={site?.name}
                  icon="Building2"
                  type="site"
                  data={site}
                  level={2}
                  count={site?.employeeCount ?? null}
                />
              ))}
            </TreeNode>
          )}
        </TreeNode>
      </div>

      {/* Hint DnD */}
      {userRole === 'admin' && (
        <div className="mt-4 p-3 bg-muted/50 rounded-md">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Icon name="Info" size={12} />
            <span>Arrastra y suelta para reorganizar. Permite: sitio → supervisor / sitio → sin supervisor.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationalTree;
