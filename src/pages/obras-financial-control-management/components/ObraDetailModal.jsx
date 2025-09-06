import React, { useState, useEffect } from 'react';
import { X, Building, DollarSign, FileText, CreditCard, Receipt, TrendingUp, TrendingDown, Plus, Edit, AlertTriangle } from 'lucide-react';
import {
  changeOrdersService,
  invoicesService,
  paymentsService,
  expensesService,
  budgetService,
  financialAnalyticsService
} from '../../../services/obrasFinancialService';

const ObraDetailModal = ({ obra, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('resumen');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Data states
  const [financialSummary, setFinancialSummary] = useState(null);
  const [changeOrders, setChangeOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [formType, setFormType] = useState('');

  useEffect(() => {
    if (obra?.obra_id) {
      loadFinancialData();
    }
  }, [obra]);

  // Load all financial data for the obra
  const loadFinancialData = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        summaryResult,
        changeOrdersResult,
        invoicesResult,
        paymentsResult,
        expensesResult,
        budgetResult
      ] = await Promise.all([
        financialAnalyticsService?.getObraFinancialSummary(obra?.obra_id),
        changeOrdersService?.getByObraId(obra?.obra_id),
        invoicesService?.getByObraId(obra?.obra_id),
        paymentsService?.getByObraId(obra?.obra_id),
        expensesService?.getByObraId(obra?.obra_id),
        budgetService?.getByObraId(obra?.obra_id)
      ]);

      if (summaryResult?.data) setFinancialSummary(summaryResult?.data);
      if (changeOrdersResult?.data) setChangeOrders(changeOrdersResult?.data);
      if (invoicesResult?.data) setInvoices(invoicesResult?.data);
      if (paymentsResult?.data) setPayments(paymentsResult?.data);
      if (expensesResult?.data) setExpenses(expensesResult?.data);
      if (budgetResult?.data) setBudgetItems(budgetResult?.data);

      // Handle any errors
      const errors = [
        summaryResult?.error,
        changeOrdersResult?.error,
        invoicesResult?.error,
        paymentsResult?.error,
        expensesResult?.error,
        budgetResult?.error
      ]?.filter(Boolean);

      if (errors?.length > 0) {
        setError(`Algunos datos no se pudieron cargar: ${errors?.[0]}`);
      }
    } catch (err) {
      setError('Error al cargar los datos financieros');
      console.error('Error loading financial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '$0.00';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    })?.format(amount);
  };

  // Format percentage
  const formatPercentage = (value) => {
    if (!value && value !== 0) return '0%';
    return `${value?.toFixed(1)}%`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    return new Date(dateString)?.toLocaleDateString('es-MX');
  };

  // Handle add new item
  const handleAddNewItem = (type) => {
    setFormType(type);
    setShowAddForm(true);
  };

  // Get status color class for invoices
  const getInvoiceStatusColor = (status) => {
    switch (status) {
      case 'Pagada':
        return 'bg-green-100 text-green-800';
      case 'Parcialmente pagada':
        return 'bg-yellow-100 text-yellow-800';
      case 'Pendiente':
        return 'bg-red-100 text-red-800';
      case 'Cancelada':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render KPI card
  const KPICard = ({ icon, title, value, subtitle, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 p-3 rounded-full bg-${color}-100`}>
          {React.cloneElement(icon, { className: `h-6 w-6 text-${color}-600` })}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  // Tab content components
  const renderResumenTab = () => (
    <div className="space-y-6">
      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <KPICard
          icon={<DollarSign />}
          title="Presupuesto Total"
          value={formatCurrency(financialSummary?.presupuesto_total)}
          subtitle={`Inicial: ${formatCurrency(obra?.presupuesto_inicial)}`}
          color="blue"
        />
        <KPICard
          icon={<TrendingUp />}
          title="Total Facturado"
          value={formatCurrency(financialSummary?.facturado_total)}
          subtitle=""
          color="green"
        />
        <KPICard
          icon={<Receipt />}
          title="Total Pagado"
          value={formatCurrency(financialSummary?.pagado_total)}
          subtitle=""
          color="emerald"
        />
        <KPICard
          icon={<AlertTriangle />}
          title="Por Cobrar"
          value={formatCurrency(financialSummary?.por_cobrar)}
          subtitle=""
          color="orange"
        />
        <KPICard
          icon={<TrendingDown />}
          title="Total Gastos"
          value={formatCurrency(financialSummary?.gastos_total)}
          subtitle=""
          color="red"
        />
        <KPICard
          icon={<TrendingUp />}
          title="Utilidad Real"
          value={formatPercentage(financialSummary?.utilidad_pct_real)}
          subtitle={formatCurrency(financialSummary?.utilidad_bruta)}
          color="green"
        />
      </div>

      {/* Progress indicators */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Avance Financiero</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
              <span>Avance de Pagos</span>
              <span>{formatPercentage(financialSummary?.avance_financiero_pct)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(financialSummary?.avance_financiero_pct || 0, 100)}%` }}
              ></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm font-medium text-gray-600 mb-1">
              <span>Margen Presupuestado</span>
              <span>{formatPercentage(financialSummary?.margen_presupuestado_pct)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  (financialSummary?.margen_presupuestado_pct || 0) >= 0 ? 'bg-green-600' : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(Math.abs(financialSummary?.margen_presupuestado_pct || 0), 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderOrdenesCambioTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Órdenes de Cambio</h3>
        <button
          onClick={() => handleAddNewItem('changeOrder')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Orden</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {changeOrders?.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {changeOrders?.map((order) => (
                <tr key={order?.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order?.folio}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {order?.descripcion}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(order?.monto)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(order?.fecha)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay órdenes de cambio registradas</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderFacturasTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Facturas y Requisiciones</h3>
        <button
          onClick={() => handleAddNewItem('invoice')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva Factura</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {invoices?.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emisión</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices?.map((invoice) => (
                <tr key={invoice?.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice?.folio}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      invoice?.tipo === 'Factura' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {invoice?.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(invoice?.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getInvoiceStatusColor(invoice?.estatus)}`}>
                      {invoice?.estatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(invoice?.fecha_emision)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(invoice?.fecha_vencimiento)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay facturas registradas</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderPagosTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Pagos Recibidos</h3>
        <button
          onClick={() => handleAddNewItem('payment')}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Pago</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {payments?.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Método</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referencia</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Factura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {payments?.map((payment) => (
                <tr key={payment?.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(payment?.fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    {formatCurrency(payment?.monto)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment?.metodo || 'No especificado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment?.referencia || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {payment?.factura?.folio || 'Sin asociar'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay pagos registrados</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderGastosTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Gastos</h3>
        <button
          onClick={() => handleAddNewItem('expense')}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Registrar Gasto</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {expenses?.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoría</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Proveedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {expenses?.map((expense) => (
                <tr key={expense?.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(expense?.fecha)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {expense?.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense?.proveedor?.nombre || 'Sin especificar'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    {formatCurrency(expense?.total)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {expense?.folio || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No hay gastos registrados</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Building className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{obra?.nombre}</h2>
              <p className="text-sm text-gray-500">{obra?.clave} • {obra?.empresa_nombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'resumen', label: 'Resumen', icon: <TrendingUp className="h-4 w-4" /> },
              { key: 'ordenes', label: 'Órdenes de Cambio', icon: <Edit className="h-4 w-4" /> },
              { key: 'facturas', label: 'Facturas', icon: <FileText className="h-4 w-4" /> },
              { key: 'pagos', label: 'Pagos', icon: <CreditCard className="h-4 w-4" /> },
              { key: 'gastos', label: 'Gastos', icon: <Receipt className="h-4 w-4" /> }
            ]?.map((tab) => (
              <button
                key={tab?.key}
                onClick={() => setActiveTab(tab?.key)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab?.key
                    ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab?.icon}
                <span>{tab?.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-4"></div>
              <span className="text-gray-600">Cargando datos...</span>
            </div>
          ) : (
            <>
              {activeTab === 'resumen' && renderResumenTab()}
              {activeTab === 'ordenes' && renderOrdenesCambioTab()}
              {activeTab === 'facturas' && renderFacturasTab()}
              {activeTab === 'pagos' && renderPagosTab()}
              {activeTab === 'gastos' && renderGastosTab()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ObraDetailModal;