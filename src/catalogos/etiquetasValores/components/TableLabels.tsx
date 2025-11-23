import {
  AnalyticalTable,
  AnalyticalTableSelectionMode,
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
import { setLabels, getOperations, removeOperation, subscribe, Operation } from '../store/labelStore';
import { EditableCell, ImagePopoverCell, PopoverCell, TokenViewCell } from './EditableCell';

interface TableLabelsProps {
  data: TableParentRow[];
  onSelectionChange?: (labels: TableParentRow[]) => void;
  onValorSelectionChange?: (valores: TableSubRow[], parent: TableParentRow | null) => void;
  initialExpanded?: Record<string, boolean>;
  onExpandChange?: (expanded: Record<string, boolean>) => void;
  headerContent?: React.ReactNode;
}

// --- DEFINICIÓN DE COLUMNAS ---
const parentColumns = [
{ 
    Header: "Etiqueta", 
    accessor: "etiqueta", 
    Cell: (props: any) => <EditableCell {...props} /> 
  },
  { 
    Header: "IDETIQUETA", 
    accessor: "idetiqueta", 
    Cell: (props: any) => <EditableCell {...props} /> 
  },
  { 
    Header: "IDSOCIEDAD", 
    accessor: "idsociedad",
    Cell: (props: any) => <EditableCell {...props} editorType="sociedad" /> 
  },
  { 
    Header: "IDCEDI", 
    accessor: "idcedi",
    Cell: (props: any) => <EditableCell {...props} editorType="cedi" />
  },
  { 
    Header: "COLECCION", 
    accessor: "coleccion", 
    Cell: (props: any) => <EditableCell {...props} /> 
  },
  { 
    Header: "SECCION", 
    accessor: "seccion", 
    Cell: (props: any) => <EditableCell {...props} /> 
  },
  { 
    Header: "SECUENCIA", 
    accessor: "secuencia",
    Cell: (props: any) => <EditableCell {...props} />
  },
  {
    Header: "INDICE",
    accessor: "indice",
    Cell: (props: any) => <EditableCell {...props} editorType="indice" viewComponent={TokenViewCell} />  },
  {
    Header: "IMAGEN",
    accessor: "imagen",
    Cell: (props: any) => <EditableCell {...props} viewComponent={ImagePopoverCell} />
  },
  { 
    Header: "RUTA", 
    accessor: "ruta", 
    Cell: (props: any) => <EditableCell {...props} /> 
  },
  { 
    Header: "DESCRIPCION", 
    accessor: "descripcion", 
    Cell: (props: any) => <EditableCell {...props} /> 
  },
];

const childColumns = [
  { 
    Header: "ID VALOR", 
    accessor: "idvalor", 
    Cell: (props: any) => <EditableCell {...props} />
  },
{ 
    Header: "VALOR", 
    accessor: "valor", 
    Cell: (props: any) => <EditableCell {...props} /> 
  },  
  { 
    Header: "ID VALOR PADRE", 
    accessor: "idvalorpa", 
    Cell: (props: any) => <EditableCell {...props} editorType="parentSelector" /> 
  },  
  { Header: "SOCIEDAD", accessor: "idsociedad", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
  { Header: "CEDI", accessor: "idcedi", Cell: ({ cell: { value } }: any) => <PopoverCell value={value} /> },
  { 
    Header: "ALIAS", 
    accessor: "alias", 
    Cell: (props: any) => <EditableCell {...props} /> 
  },
  { 
    Header: "SECUENCIA", 
    accessor: "secuencia",
    Cell: (props: any) => <EditableCell {...props} />
  },
  {
    Header: "ÍNDICE",
    accessor: "indice",
    Cell: (props: any) => <EditableCell {...props} editorType="indice" viewComponent={TokenViewCell} />  },
  {
    Header: "IMAGEN",
    accessor: "imagen",
    Cell: (props: any) => <EditableCell {...props} viewComponent={ImagePopoverCell} />
  },
  { 
    Header: "RUTA", 
    accessor: "ruta", 
    Cell: (props: any) => <EditableCell {...props} /> },
  { 
    Header: "DESCRIPCION", 
    accessor: "descripcion", 
    Cell: (props: any) => <EditableCell {...props} /> },
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

  useEffect(() => {
    const updateOps = () => setPendingOps(getOperations());
    updateOps();
    return subscribe(updateOps);
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
            <Button
              icon="pending"
              design="Emphasized"
              onClick={() => setShowOpsDialog(true)}
            >
              Operaciones Pendientes ({pendingOps.length})
            </Button>
          )}
        </div>

        {headerContent && (
          <div style={{ width: '100%' }}>
            {headerContent}
          </div>
        )}
      </div>

      {/* Tabla - CAMBIO CLAVE: Eliminamos el div wrapper con overflow */}
      <AnalyticalTable
        columns={parentColumns}
        data={tableData}
        filterable
        style={{ height: '100%' }}
        groupable
        selectionMode={AnalyticalTableSelectionMode.Multiple}
        minRows={5}
        // visibleRows={12}
        // visibleRowCountMode="Fixed"
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