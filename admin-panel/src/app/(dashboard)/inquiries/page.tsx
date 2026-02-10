'use client';

import { useState, useEffect, useCallback } from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/Modal';
import Pagination from '@/components/Pagination';
import StatusBadge from '@/components/StatusBadge';
import { getInquiries, updateInquiryStatus } from '@/lib/api';
import { Inquiry, PaginatedResponse } from '@/lib/types';
import { formatDate, formatDateTime, truncate } from '@/lib/utils';

const STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'read', label: 'Read' },
  { value: 'replied', label: 'Replied' },
  { value: 'closed', label: 'Closed' },
];

export default function InquiriesPage() {
  const [data, setData] = useState<PaginatedResponse<Inquiry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [showModal, setShowModal] = useState(false);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getInquiries({
        page,
        per_page: 10,
        status: statusFilter || undefined,
      });
      setData(result);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    loadInquiries();
  }, [loadInquiries]);

  function viewInquiry(inquiry: Inquiry) {
    setSelectedInquiry(inquiry);
    setShowModal(true);
  }

  async function handleStatusChange(inquiryId: string, newStatus: string) {
    try {
      await updateInquiryStatus(inquiryId, newStatus);
      loadInquiries();
      if (selectedInquiry && selectedInquiry.id === inquiryId) {
        setSelectedInquiry({ ...selectedInquiry, status: newStatus as Inquiry['status'] });
      }
    } catch (err) {
      console.error('Failed to update inquiry status:', err);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Inquiries</h1>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="select-field sm:w-48"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-admin-border">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Property</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Message</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 bg-slate-200 rounded w-3/4" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data && data.data.length > 0 ? (
                data.data.map((inquiry) => (
                  <tr key={inquiry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {inquiry.property_image && (
                          <div className="h-8 w-10 rounded bg-slate-200 overflow-hidden flex-shrink-0">
                            <img
                              src={inquiry.property_image}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                        )}
                        <span className="text-sm text-slate-700 font-medium">
                          {truncate(inquiry.property_title, 25)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{inquiry.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">{inquiry.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {truncate(inquiry.message, 40)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusChange(inquiry.id, e.target.value)}
                        className="text-xs font-medium rounded-full px-2 py-1 border-0 cursor-pointer focus:ring-2 focus:ring-primary-500"
                        style={{
                          backgroundColor:
                            inquiry.status === 'new' ? '#dbeafe' :
                            inquiry.status === 'read' ? '#fef3c7' :
                            inquiry.status === 'replied' ? '#d1fae5' :
                            '#f1f5f9',
                          color:
                            inquiry.status === 'new' ? '#1d4ed8' :
                            inquiry.status === 'read' ? '#b45309' :
                            inquiry.status === 'replied' ? '#047857' :
                            '#475569',
                        }}
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {formatDate(inquiry.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => viewInquiry(inquiry)}
                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="View details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    No inquiries found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data && data.total_pages > 1 && (
          <Pagination
            currentPage={data.page}
            totalPages={data.total_pages}
            onPageChange={setPage}
          />
        )}
      </div>

      {/* Inquiry Detail Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Inquiry Details"
        size="lg"
      >
        {selectedInquiry && (
          <div className="space-y-4">
            {/* Property Info */}
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              {selectedInquiry.property_image && (
                <div className="h-16 w-20 rounded-lg bg-slate-200 overflow-hidden flex-shrink-0">
                  <img
                    src={selectedInquiry.property_image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-slate-900">{selectedInquiry.property_title}</p>
                <p className="text-xs text-slate-400">Property ID: {selectedInquiry.property_id}</p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Name</p>
                <p className="text-sm text-slate-900">{selectedInquiry.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Email</p>
                <p className="text-sm text-slate-900">{selectedInquiry.email}</p>
              </div>
              {selectedInquiry.phone && (
                <div>
                  <p className="text-xs font-medium text-slate-400 uppercase mb-1">Phone</p>
                  <p className="text-sm text-slate-900">{selectedInquiry.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase mb-1">Date</p>
                <p className="text-sm text-slate-900">{formatDateTime(selectedInquiry.created_at)}</p>
              </div>
            </div>

            {/* Message */}
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase mb-1">Message</p>
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between pt-2 border-t border-admin-border">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">Status:</span>
                <StatusBadge status={selectedInquiry.status} variant="inquiry" />
              </div>
              <div className="flex items-center gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(selectedInquiry.id, opt.value)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      selectedInquiry.status === opt.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
