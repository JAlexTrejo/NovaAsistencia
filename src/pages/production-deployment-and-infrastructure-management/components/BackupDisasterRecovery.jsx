import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw, Download, Upload, CheckCircle, XCircle, Clock, AlertTriangle, Database, FileText, Calendar, Archive, Shield, Activity, Play } from 'lucide-react';

const BackupDisasterRecovery = () => {
  const [backupStatus, setBackupStatus] = useState({});
  const [backupHistory, setBackupHistory] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [recoveryTests, setRecoveryTests] = useState([]);
  const [retentionPolicies, setRetentionPolicies] = useState({});
  const [loading, setLoading] = useState(true);
  const [runningBackup, setRunningBackup] = useState(null);
  const [restoreModal, setRestoreModal] = useState(null);

  // Load backup and recovery data
  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    setLoading(true);
    try {
      // Simulate API calls for backup data
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock backup status
      setBackupStatus({
        lastBackup: new Date(Date.now() - 3600000)?.toISOString(),
        nextScheduled: new Date(Date.now() + 82800000)?.toISOString(),
        totalBackups: 247,
        totalSize: '45.2 GB',
        successRate: 99.6,
        activeJobs: 0,
        failedJobs: 1
      });

      // Mock backup history
      setBackupHistory([
        {
          id: 'backup-001',
          type: 'full',
          status: 'completed',
          size: '2.3 GB',
          duration: '00:12:34',
          startTime: new Date(Date.now() - 3600000)?.toISOString(),
          endTime: new Date(Date.now() - 3540000)?.toISOString(),
          location: 's3://nova-hr-backups/full/',
          retention: '30 days'
        },
        {
          id: 'backup-002',
          type: 'incremental',
          status: 'completed',
          size: '847 MB',
          duration: '00:04:21',
          startTime: new Date(Date.now() - 86400000)?.toISOString(),
          endTime: new Date(Date.now() - 86400000 + 261000)?.toISOString(),
          location: 's3://nova-hr-backups/incremental/',
          retention: '7 days'
        },
        {
          id: 'backup-003',
          type: 'full',
          status: 'failed',
          size: '0 B',
          duration: '00:02:15',
          startTime: new Date(Date.now() - 172800000)?.toISOString(),
          endTime: new Date(Date.now() - 172800000 + 135000)?.toISOString(),
          location: 's3://nova-hr-backups/full/',
          retention: '30 days',
          error: 'Connection timeout to storage backend'
        },
        {
          id: 'backup-004',
          type: 'differential',
          status: 'completed',
          size: '1.1 GB',
          duration: '00:07:42',
          startTime: new Date(Date.now() - 259200000)?.toISOString(),
          endTime: new Date(Date.now() - 259200000 + 462000)?.toISOString(),
          location: 's3://nova-hr-backups/differential/',
          retention: '14 days'
        }
      ]);

      // Mock backup schedules
      setSchedules([
        {
          id: 'daily-incremental',
          name: 'Daily Incremental Backup',
          type: 'incremental',
          frequency: 'daily',
          time: '02:00',
          timezone: 'America/Monterrey',
          enabled: true,
          retention: '7 days',
          nextRun: new Date(Date.now() + 82800000)?.toISOString()
        },
        {
          id: 'weekly-full',
          name: 'Weekly Full Backup',
          type: 'full',
          frequency: 'weekly',
          time: '01:00',
          timezone: 'America/Monterrey',
          enabled: true,
          retention: '30 days',
          nextRun: new Date(Date.now() + 518400000)?.toISOString()
        },
        {
          id: 'monthly-archive',
          name: 'Monthly Archive',
          type: 'archive',
          frequency: 'monthly',
          time: '00:00',
          timezone: 'America/Monterrey',
          enabled: true,
          retention: '1 year',
          nextRun: new Date(Date.now() + 2592000000)?.toISOString()
        }
      ]);

      // Mock recovery tests
      setRecoveryTests([
        {
          id: 'test-001',
          name: 'Database Recovery Test',
          type: 'database',
          status: 'passed',
          lastRun: new Date(Date.now() - 604800000)?.toISOString(),
          duration: '00:23:15',
          success: true,
          nextScheduled: new Date(Date.now() + 2592000000)?.toISOString()
        },
        {
          id: 'test-002',
          name: 'Application Files Recovery',
          type: 'files',
          status: 'passed',
          lastRun: new Date(Date.now() - 1209600000)?.toISOString(),
          duration: '00:15:42',
          success: true,
          nextScheduled: new Date(Date.now() + 2592000000)?.toISOString()
        },
        {
          id: 'test-003',
          name: 'Full System Recovery',
          type: 'system',
          status: 'failed',
          lastRun: new Date(Date.now() - 1814400000)?.toISOString(),
          duration: '01:12:33',
          success: false,
          nextScheduled: new Date(Date.now() + 86400000)?.toISOString(),
          error: 'Network connectivity issues during restore'
        }
      ]);

      // Mock retention policies
      setRetentionPolicies({
        daily: '7 days',
        weekly: '4 weeks',
        monthly: '12 months',
        yearly: '7 years',
        autoDelete: true,
        compressionEnabled: true,
        encryptionEnabled: true
      });

    } catch (error) {
      console.error('Failed to load backup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupAction = async (action, backupId = null) => {
    try {
      setRunningBackup(action);
      console.log(`Executing backup action: ${action}${backupId ? ` for ${backupId}` : ''}`);
      
      switch (action) {
        case 'full': console.log('Starting full backup...');
          break;
        case 'incremental': console.log('Starting incremental backup...');
          break;
        case 'restore':
          console.log(`Initiating restore from backup ${backupId}`);
          break;
        case 'test-restore': console.log('Starting test restore...');
          break;
        default:
          console.log(`Unknown action: ${action}`);
      }

      // Simulate backup/restore process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Refresh data after action
      await loadBackupData();
      
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error);
    } finally {
      setRunningBackup(null);
      setRestoreModal(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getBackupTypeIcon = (type) => {
    switch (type) {
      case 'full':
        return <HardDrive className="h-4 w-4 text-blue-500" />;
      case 'incremental':
        return <Upload className="h-4 w-4 text-green-500" />;
      case 'differential':
        return <Activity className="h-4 w-4 text-purple-500" />;
      case 'archive':
        return <Archive className="h-4 w-4 text-orange-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <HardDrive className="h-8 w-8 animate-pulse text-blue-600" />
        <span className="ml-2 text-gray-600">Loading backup and recovery data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Backup Status Overview */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Backup Status</h3>
            <p className="text-sm text-gray-600">Current backup and recovery system status</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => handleBackupAction('incremental')}
              disabled={runningBackup}
              className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {runningBackup === 'incremental' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>Run Incremental</span>
            </button>
            <button
              onClick={() => handleBackupAction('full')}
              disabled={runningBackup}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              {runningBackup === 'full' ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <HardDrive className="h-4 w-4" />
              )}
              <span>Run Full Backup</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">{backupStatus?.totalBackups}</div>
            <div className="text-sm text-blue-700">Total Backups</div>
            <div className="text-xs text-blue-600 mt-1">{backupStatus?.totalSize}</div>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-900">{backupStatus?.successRate}%</div>
            <div className="text-sm text-green-700">Success Rate</div>
            <div className="text-xs text-green-600 mt-1">Last 30 days</div>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{backupStatus?.activeJobs}</div>
            <div className="text-sm text-gray-700">Active Jobs</div>
            <div className="text-xs text-gray-600 mt-1">Currently running</div>
          </div>
          
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-900">{backupStatus?.failedJobs}</div>
            <div className="text-sm text-red-700">Failed Jobs</div>
            <div className="text-xs text-red-600 mt-1">Needs attention</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Last Backup: </span>
            <span className="font-medium">{new Date(backupStatus?.lastBackup)?.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-gray-600">Next Scheduled: </span>
            <span className="font-medium">{new Date(backupStatus?.nextScheduled)?.toLocaleString()}</span>
          </div>
        </div>
      </div>
      {/* Backup History */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Backup History</h3>
          <p className="text-sm text-gray-600 mt-1">Recent backup operations and results</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Backup
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backupHistory?.map((backup) => (
                <tr key={backup?.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="mr-3">
                        {getBackupTypeIcon(backup?.type)}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {backup?.id}
                        </div>
                        <div className="text-sm text-gray-500">
                          {backup?.location}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      backup?.type === 'full' ? 'bg-blue-100 text-blue-800' :
                      backup?.type === 'incremental' ? 'bg-green-100 text-green-800' :
                      backup?.type === 'differential'? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800'
                    }`}>
                      {backup?.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(backup?.status)}
                      <span className={`ml-2 text-sm ${
                        backup?.status === 'completed' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {backup?.status}
                      </span>
                    </div>
                    {backup?.error && (
                      <div className="text-xs text-red-600 mt-1">
                        {backup?.error}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup?.size}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {backup?.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(backup?.startTime)?.toLocaleDateString()}
                    <div className="text-xs text-gray-500">
                      {new Date(backup?.startTime)?.toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {backup?.status === 'completed' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setRestoreModal(backup?.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Restore"
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleBackupAction('test-restore', backup?.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Test Restore"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Schedules and Recovery Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Backup Schedules */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Backup Schedules</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {schedules?.map((schedule) => (
                <div key={schedule?.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-gray-900">{schedule?.name}</span>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${
                      schedule?.enabled ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  
                  <div className="text-sm space-y-1 text-gray-600">
                    <div>Frequency: {schedule?.frequency} at {schedule?.time}</div>
                    <div>Retention: {schedule?.retention}</div>
                    <div>Next run: {new Date(schedule?.nextRun)?.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recovery Tests */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Recovery Tests</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recoveryTests?.map((test) => (
                <div key={test?.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-4 w-4 text-purple-500" />
                      <span className="font-medium text-gray-900">{test?.name}</span>
                    </div>
                    {getStatusIcon(test?.status)}
                  </div>
                  
                  <div className="text-sm space-y-1 text-gray-600">
                    <div>Last run: {new Date(test?.lastRun)?.toLocaleDateString()}</div>
                    <div>Duration: {test?.duration}</div>
                    <div>Next test: {new Date(test?.nextScheduled)?.toLocaleDateString()}</div>
                    {test?.error && (
                      <div className="text-red-600 text-xs mt-2">{test?.error}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Restore Confirmation Modal */}
      {restoreModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Restore</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to restore from backup <strong>{restoreModal}</strong>? 
              This action will overwrite current data and cannot be undone.
            </p>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setRestoreModal(null)}
                className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleBackupAction('restore', restoreModal)}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors"
              >
                Confirm Restore
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupDisasterRecovery;