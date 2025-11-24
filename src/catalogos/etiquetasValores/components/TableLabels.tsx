import {
  AnalyticalTable,
  AnalyticalTableSelectionMode,
  Tokenizer,
  Token,
  AnalyticalTableHooks,
  Title,
  Button,
  Dialog,
  List,
  ListItemCustom,
  FlexBox,
  FlexBoxAlignItems,
  FlexBoxDirection,
  FlexBoxJustifyContent,
} from '@ui5/webcomponents-react';
import '@ui5/webcomponents-icons/dist/pending';
import '@ui5/webcomponents-icons/dist/delete';
import { TableParentRow, TableSubRow } from '../services/labelService';
import { useMemo, useRef, useState, useEffect, } from 'react';
import { createPortal, } from 'react-dom';
import { setLabels, getOperations, removeOperation, subscribe, Operation, getLabels } from '../store/labelStore';

interface TableLabelsProps {
  data: TableParentRow[];
  onSelectionChange?: (labels: TableParentRow[]) => void;
  onValorSelectionChange?: (valores: TableSubRow[], parent: TableParentRow | null) => void;
  initialExpanded?: Record<string, boolean>;
  onExpandChange?: (expanded: Record<string, boolean>) => void;
  headerContent?: React.ReactNode;
}

// --- COMPONENTE POPOVER PARA TEXTO ---
const PopoverCell = ({ value }: { value: string }) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number; flipX: boolean } | null>(null);

  useEffect(() => {
    const checkTruncation = () => {
      if (cellRef.current) {
        const { scrollWidth, clientWidth } = cellRef.current;
        setIsTruncated(scrollWidth > clientWidth);
      }
    };

    checkTruncation();
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [value]);

  const handleMouseEnter = () => {
    if (!cellRef.current || !isTruncated) return;

    const rect = cellRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const popoverMaxWidth = 400;
    const margin = 10;
    const estimatedPopoverHeight = 200;

    const availableSpaceRight = screenWidth - rect.right;
    const availableSpaceLeft = rect.left;

    let x = 0;
    let y = rect.top;
    let flipX = false;

    if (availableSpaceRight >= popoverMaxWidth + margin) {
      x = rect.right + 5;
      flipX = false;
    } else if (availableSpaceLeft >= popoverMaxWidth + margin) {
      x = rect.left - 5;
      flipX = true;
    } else if (availableSpaceLeft > availableSpaceRight) {
      x = rect.left - 5;
      flipX = true;
    } else {
      x = rect.right + 5;
      flipX = false;
    }

    if ((rect.top + estimatedPopoverHeight) > (screenHeight - margin)) {
      y = rect.bottom;
    } else {
      y = rect.top;
    }

    setPopoverPosition({ x, y, flipX });
  };

  const handleMouseLeave = () => {
    setPopoverPosition(null);
  };

  const popoverStyle: React.CSSProperties = popoverPosition ? (() => {
    const screenHeight = window.innerHeight;
    const margin = 10;
    const currentRect = cellRef.current?.getBoundingClientRect();

    const transformX = popoverPosition.flipX ? '-100%' : '0';
    let transformY = '-1px';

    if (currentRect && popoverPosition.y === currentRect.bottom) {
      transformY = '-100%';
    }

    const transform = `translate(${transformX}, ${transformY})`;

    return {
      position: 'fixed',
      zIndex: 100000,
      whiteSpace: 'pre-wrap',
      width: 'max-content',
      wordBreak: 'break-word',
      maxWidth: '400px',
      backgroundColor: 'var(--sapBackgroundColor, white)',
      border: '1px solid var(--sapField_BorderColor, #888)',
      boxShadow: '0 5px 10px rgba(0,0,0,0.3)',
      padding: '0.5rem',
      borderRadius: '4px',
      left: popoverPosition.x,
      top: popoverPosition.y,
      transform: transform,
      maxHeight: `calc(${screenHeight - margin * 2}px)`,
      overflowY: 'auto',
      color: 'var(--sapTextColor, black)',
      fontSize: '0.875rem',
      pointerEvents: 'none'
    };
  })() : {};

  return (
    <>
      <div
        ref={cellRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          cursor: isTruncated ? 'help' : 'inherit'
        }}
      >
        {value}
      </div>
      {popoverPosition && createPortal(
        <div style={popoverStyle}>
          {value}
        </div>,
        document.body
      )}
    </>
  );
};

// --- NUEVO COMPONENTE POPOVER PARA IMAGENES ---
const ImagePopoverCell = ({ value }: { value: string }) => {
  const cellRef = useRef<HTMLDivElement>(null);
  const [popoverPosition, setPopoverPosition] = useState<{ x: number; y: number; flipX: boolean } | null>(null);

  if (!value) return null;

  const handleMouseEnter = () => {
    if (!cellRef.current) return;

    const rect = cellRef.current.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    const popoverMaxWidth = 320;
    const margin = 10;
    const estimatedPopoverHeight = 320;

    const availableSpaceRight = screenWidth - rect.right;
    const availableSpaceLeft = rect.left;

    let x = 0;
    let y = rect.top;
    let flipX = false;

    if (availableSpaceRight >= popoverMaxWidth + margin) {
      x = rect.right + 5;
      flipX = false;
    } else if (availableSpaceLeft >= popoverMaxWidth + margin) {
      x = rect.left - 5;
      flipX = true;
    } else if (availableSpaceLeft > availableSpaceRight) {
      x = rect.left - 5;
      flipX = true;
    } else {
      x = rect.right + 5;
      flipX = false;
    }

    if ((rect.top + estimatedPopoverHeight) > (screenHeight - margin)) {
      y = rect.bottom;
    } else {
      y = rect.top;
    }

    setPopoverPosition({ x, y, flipX });
  };

  const handleMouseLeave = () => {
    setPopoverPosition(null);
  };

  const popoverStyle: React.CSSProperties = popoverPosition ? (() => {
    const currentRect = cellRef.current?.getBoundingClientRect();
    const transformX = popoverPosition.flipX ? '-100%' : '0';
    let transformY = '0';

    if (currentRect && popoverPosition.y === currentRect.bottom) {
      transformY = '-100%';
    }

    const transform = `translate(${transformX}, ${transformY})`;

    return {
      position: 'fixed',
      zIndex: 100000,
      padding: '0.5rem',
      backgroundColor: 'var(--sapBackgroundColor, white)',
      border: '1px solid var(--sapField_BorderColor, #888)',
      borderRadius: '4px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
      left: popoverPosition.x,
      top: popoverPosition.y,
      transform: transform,
      pointerEvents: 'none',
      maxWidth: '320px',
      maxHeight: '320px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    };
  })() : {};

  return (
    <>
      <div
        ref={cellRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'flex', alignItems: 'center', height: '100%' }}
      >
        <img
          src={value}
          style={{ height: "40px", width: "auto", cursor: "zoom-in" }}
          alt={value}
        />
      </div>

      {popoverPosition && createPortal(
        <div style={popoverStyle}>
          <img
            src={value}
            style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
            alt="preview"
          />
        </div>,
        document.body
      )}
    </>
  );
};

// --- COMPONENTE CEDI CELL ---
const CediCell = ({ value }: { value: any }) => {
  const valStr = value != null ? String(value) : '';
  if (parseInt(valStr, 10) === 0) return <PopoverCell value="Todos los CEDI" />;

  const labels = getLabels();
  const cediLabel = labels.find(l => l.idetiqueta === 'CEDI');

  let displayValue = valStr;
  if (cediLabel && cediLabel.subRows) {
    const found = cediLabel.subRows.find(sub => parseInt(sub.idvalor, 10) === parseInt(valStr, 10));
    if (found) {
      displayValue = found.valor;
    }
  }

  return <PopoverCell value={displayValue} />;
};

// --- COMPONENTE SOCIEDAD CELL ---
const SociedadCell = ({ value }: { value: any }) => {
  const valStr = value != null ? String(value) : '';
  if (parseInt(valStr, 10) === 0) return <PopoverCell value="Todas las sociedades" />;

  const labels = getLabels();
  const sociedadLabel = labels.find(l => l.idetiqueta === 'SOCIEDAD');

  let displayValue = valStr;
  if (sociedadLabel && sociedadLabel.subRows) {
    const found = sociedadLabel.subRows.find(sub => parseInt(sub.idvalor, 10) === parseInt(valStr, 10));
    if (found) {
      displayValue = found.valor;
    }
  }

  return <PopoverCell value={displayValue} />;
};

const parentColumns = [
  { Header: "Etiqueta", accessor: "etiqueta", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
  { Header: "IDETIQUETA", accessor: "idetiqueta", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
  { Header: "SOCIEDAD", accessor: "idsociedad", Cell: ({ cell: { value } }: any) => <SociedadCell value={value} /> },
  { Header: "CEDI", accessor: "idcedi", Cell: ({ cell: { value } }: any) => <CediCell value={value} /> },
  { Header: "COLECCION", accessor: "coleccion", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
  { Header: "SECCION", accessor: "seccion", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
  { Header: "SECUENCIA", accessor: "secuencia" },
  {
    Header: "INDICE",
    accessor: "indice",
    Cell: ({ cell: { value } }: any) => {
      const valueStr = (typeof value === 'string' && value) ? value : '';
      if (!valueStr) return null;
      const indices = valueStr.split(',').filter(v => v.trim() !== '');

      return (
        <Tokenizer title={valueStr} style={{ width: '100%', padding: '0.25rem 0' }}>
          {indices.map((indice, index) => (
            <Token key={index} text={indice.trim()} />
          ))}
        </Tokenizer>
      );
    }
  },
  {
    Header: "IMAGEN",
    accessor: "imagen",
    Cell: ({ cell: { value } }: any) => <ImagePopoverCell value={value} />
  },
  { Header: "RUTA", accessor: "ruta", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
  { Header: "DESCRIPCION", accessor: "descripcion", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
];

const childColumns = [
  { Header: "ID VALOR", accessor: "idvalor", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
  { Header: "VALOR", accessor: "valor", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
  { Header: "VALOR PADRE", accessor: "idvalorpa", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
  { Header: "SOCIEDAD", accessor: "idsociedad", Cell: ({ cell: { value } }: any) => <SociedadCell value={value} /> },
  { Header: "CEDI", accessor: "idcedi", Cell: ({ cell: { value } }: any) => <CediCell value={value} /> },
  { Header: "ALIAS", accessor: "alias", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
  { Header: "SECUENCIA", accessor: "secuencia" },
  {
    Header: "ÍNDICE",
    accessor: "indice",
    Cell: ({ cell: { value } }: any) => {
      const valueStr = (typeof value === 'string' && value) ? value : '';
      if (!valueStr) return null;
      const indices = valueStr.split(',').filter(v => v.trim() !== '');

      return (
        <Tokenizer title={valueStr} style={{ width: '100%', padding: '0.25rem 0' }}>
          {indices.map((indice, index) => (
            <Token key={index} text={indice.trim()} />
          ))}
        </Tokenizer>
      );
    }
  },
  {
    Header: "IMAGEN",
    accessor: "imagen",
    Cell: ({ cell: { value } }: any) => <ImagePopoverCell value={value} />
  },
  { Header: "RUTA", accessor: "ruta", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
  { Header: "DESCRIPCION", accessor: "descripcion", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
];

// --- WRAPPER ---
const SubTableWrapper = ({ values, parentData, handleChildSelectInternal }: { values: TableSubRow[], parentData: TableParentRow, handleChildSelectInternal: (selectedValores: TableSubRow[], parentData: TableParentRow) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const ROW_HEIGHT = 44;
  const HEADER_HEIGHT = 44;
  const TITLE_SPACE = 40;

  const minRowsToShow = 1;
  const maxVisibleRows = 10;

  const rowCount = values.length;
  const rowsToShow = Math.min(Math.max(rowCount, minRowsToShow), maxVisibleRows);

  const calculatedHeight = (rowsToShow * ROW_HEIGHT) + HEADER_HEIGHT + TITLE_SPACE + 12;

  const tableHooks = useMemo(() => [
    AnalyticalTableHooks.useManualRowSelect('isSelected')
  ], []);

  return (
    <div
      ref={containerRef}
      style={{
        height: `${calculatedHeight}px`,
        padding: '0 1rem 1rem 1rem',
        width: '100%',
        boxSizing: 'border-box',
        overflow: 'hidden',
        backgroundColor: 'var(--sapList_Background)',
        borderBottom: '1px solid var(--sapList_BorderColor)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Title level='H5' style={{ marginBottom: '0.5rem', height: '26px' }}>
        Valores para: {parentData.etiqueta}
      </Title>

      <div style={{ height: `calc(100% - 30px)` }}>
        <AnalyticalTable
          data={values}
          columns={childColumns}
          selectionMode={AnalyticalTableSelectionMode.Multiple}
          isTreeTable={false}
          minRows={1}
          visibleRows={rowsToShow}
          headerRowHeight={HEADER_HEIGHT}
          rowHeight={ROW_HEIGHT}
          withRowHighlight={true}
          reactTableOptions={{
            getRowId: (row: any) => `sub-child-${row.idvalor}`
          }}
          tableHooks={tableHooks}
          onRowSelect={(e) => {
            if (!e || !e.detail) return;
            const { selectedRowIds, rowsById } = e.detail;
            const selectedRows = Object.keys(selectedRowIds).map(id => rowsById[id]);
            const selectedValores = selectedRows.map(r => r.original as TableSubRow);
            handleChildSelectInternal(selectedValores, parentData);
          }}
        />
      </div>
    </div>
  );
};

const TableLabels = ({ data, onSelectionChange, onValorSelectionChange, initialExpanded, headerContent, onExpandChange }: TableLabelsProps) => {

  const dataRef = useRef(data);
  const onSelectionChangeRef = useRef(onSelectionChange);
  const onValorSelectionChangeRef = useRef(onValorSelectionChange);

  dataRef.current = data;
  onSelectionChangeRef.current = onSelectionChange;
  onValorSelectionChangeRef.current = onValorSelectionChange;

  const [pendingOps, setPendingOps] = useState<Operation[]>([]);
  const [showOpsDialog, setShowOpsDialog] = useState(false);
  const [isMobileButton, setIsMobileButton] = useState(false);

  useEffect(() => {
    const updateOps = () => setPendingOps(getOperations());
    updateOps();
    return subscribe(updateOps);
  }, []);


  useEffect(() => {
    const checkSize = () => {
      setIsMobileButton(window.innerWidth < 700);
    };

    // Ejecutar al inicio
    checkSize();

    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  const tableData = useMemo(() => {
    return data.map(row => ({
      ...row,
      values: row.subRows,
      subRows: undefined,
    }));
  }, [data]);

  const reactTableOptions = useMemo(() => ({
    autoResetExpanded: false,
    initialState: { expanded: initialExpanded || {} },
    getRowId: (row: any) => {
      if (row.idvalor) {
        return `child-${row.idvalor}`;
      }
      return `parent-${row.idetiqueta}`;
    }
  }), [initialExpanded]);

  const handleChildSelectInternal = (selectedValores: TableSubRow[], parentData: TableParentRow) => {
    const currentData = dataRef.current;
    const updatedData = currentData.map(row => {
      let newSubRows = row.subRows;
      if (row.idetiqueta === parentData.idetiqueta) {
        const selectedIds = new Set(selectedValores.map(v => v.idvalor));
        newSubRows = row.subRows.map(sub => ({
          ...sub,
          isSelected: selectedIds.has(sub.idvalor)
        }));
      }
      return { ...row, subRows: newSubRows };
    });

    setLabels(updatedData);

    const allSelectedValores: TableSubRow[] = [];
    updatedData.forEach(row => {
      row.subRows.forEach(sub => {
        if (sub.isSelected) {
          allSelectedValores.push(sub);
        }
      });
    });

    onValorSelectionChangeRef.current?.(allSelectedValores, parentData);
    onSelectionChangeRef.current?.([]);
  };

  const handleParentSelect = (selectedParents: TableParentRow[]) => {
    const selectedIds = new Set(selectedParents.map(p => p.idetiqueta));
    const updatedData = data.map(row => {
      const isSelected = selectedIds.has(row.idetiqueta);
      const newSubRows = row.subRows.map(sub => ({ ...sub, isSelected: false }));
      return { ...row, isSelected, subRows: newSubRows };
    });
    setLabels(updatedData);
    onSelectionChange?.(selectedParents);
    if (selectedParents.length > 0) {
      onValorSelectionChange?.([], null);
    }
  };

  const renderRowSubComponent = useMemo(
    () =>
      (row: any) => {
        if (!row || !row.original) return null;
        const parentData: TableParentRow = row.original;
        // @ts-ignore
        const values = parentData.values || parentData.subRows || [];

        if (values.length === 0) {
          return (
            <div style={{ padding: '1rem', textAlign: 'center' }}>
              No hay Valores asociados.
            </div>
          );
        }

        return (
          <SubTableWrapper
            key={`subwrapper-${parentData.idetiqueta}`}
            values={values as TableSubRow[]}
            parentData={parentData}
            handleChildSelectInternal={handleChildSelectInternal}
          />
        );
      },
    []
  );

  const tableHooks = useMemo(() => [
    AnalyticalTableHooks.useManualRowSelect('isSelected')
  ], []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Toolbar de Operaciones y Controles */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '0.5rem',
        backgroundColor: 'var(--sapList_HeaderBackground)',
        borderBottom: '1px solid var(--sapList_BorderColor)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: headerContent ? '0.5rem' : '0' }}>
          <Title level="H4">Etiquetas y Valores</Title>
          {pendingOps.length > 0 && (
            // --- 3. CAMBIO AQUÍ: Renderizado Condicional del Texto ---
            <Button
              icon="pending"
              design="Emphasized"
              onClick={() => setShowOpsDialog(true)}
              tooltip="Operaciones Pendientes" // Añadido tooltip para accesibilidad en móvil
            >
              {isMobileButton
                ? `(${pendingOps.length})`
                : `Operaciones Pendientes (${pendingOps.length})`
              }
            </Button>
          )}
        </div>

        {headerContent && (
          <div style={{ width: '100%' }}>
            {headerContent}
          </div>
        )}
      </div>

      {/* Tabla */}
      <AnalyticalTable
        columns={parentColumns}
        data={tableData}
        filterable
        style={{ height: '100%' }}
        groupable
        selectionMode={AnalyticalTableSelectionMode.Multiple}
        minRows={5}
        visibleRows={tableData.length}
        renderRowSubComponent={renderRowSubComponent}
        tableHooks={tableHooks}
        scaleWidthMode="Smart"
        withRowHighlight={true}
        onRowSelect={(e) => {
          if (!e || !e.detail) return;
          const { selectedRowIds, rowsById } = e.detail;
          const selectedParents = Object.keys(selectedRowIds).map(id => rowsById[id].original as TableParentRow);
          handleParentSelect(selectedParents);
        }}
        reactTableOptions={reactTableOptions}
        overscanCount={5}

        onRowExpandChange={(e: any) => {
          if (onExpandChange && e.detail) {
            const { row, isExpanded } = e.detail;
            if (row && row.id) {
              onExpandChange({ [row.id]: isExpanded });
            }
          }
        }}
      />

      {/* Dialogo de Operaciones */}
      <Dialog
        open={showOpsDialog}
        onClose={() => setShowOpsDialog(false)}
        headerText="Operaciones Pendientes"
        footer={
          <div style={{ display: 'flex', justifyContent: 'end', width: '100%', padding: '0.5rem' }}>
            <Button onClick={() => setShowOpsDialog(false)}>Cerrar</Button>
          </div>
        }
      >
        <List>
          {pendingOps.map((op, index) => (
            <ListItemCustom key={op.id || index} type="Inactive">
              <FlexBox
                alignItems={FlexBoxAlignItems.Center}
                justifyContent={FlexBoxJustifyContent.SpaceBetween}
                style={{ width: '100%', padding: '0.5rem' }}
              >
                <FlexBox direction={FlexBoxDirection.Column}>
                  <span style={{ fontWeight: 'bold', color: op.action === 'DELETE' ? 'var(--sapNegativeColor)' : 'var(--sapPositiveColor)' }}>
                    {op.action} {op.collection === 'labels' ? 'Etiqueta' : 'Valor'}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--sapContent_LabelColor)' }}>
                    ID: {op.payload.id || op.payload.IDETIQUETA || op.payload.IDVALOR}
                  </span>
                  {op.action === 'UPDATE' && (
                    <span style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                      Campos: {Object.keys(op.payload.updates || {}).join(', ')}
                    </span>
                  )}
                </FlexBox>
                <Button
                  icon="delete"
                  design="Transparent"
                  onClick={() => op.id && removeOperation(op.id)}
                  tooltip="Deshacer cambio"
                />
              </FlexBox>
            </ListItemCustom>
          ))}
        </List>
      </Dialog>
    </div>
  );
};

export default TableLabels;