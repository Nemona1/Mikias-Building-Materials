// app/api/admin/security-logs/export/route.js - Fixed with multi-format export
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { hasAdminAccess } from '@/lib/auth/permissions';
import { logSecurityEvent, SecurityActions } from '@/lib/security-log';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';

export async function GET(request) {
  try {
    let token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      token = request.cookies.get('accessToken')?.value;
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { valid, decoded } = await verifyAccessToken(token);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    // Check if user has admin access (super_admin or admin)
    const isAdmin = await hasAdminAccess(decoded.userId);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }
    
    const ipAddress = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    
    await logSecurityEvent({
      userId: decoded.userId,
      action: SecurityActions.AUDIT_EXPORT,
      resourceType: 'security',
      ipAddress,
      userAgent,
      details: { format, filters: { action, userId, startDate, endDate, search } },
      success: true
    });
    
    let where = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      where.createdAt = { gte: start };
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      where.createdAt = { ...where.createdAt, lte: end };
    }
    
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { details: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    const logs = await prisma.securityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const filename = `security_logs_${new Date().toISOString().replace(/[:.]/g, '-')}`;
    
    // Format based on request
    switch (format) {
      case 'pdf':
        return exportPDF(logs, filename);
      case 'excel':
        return exportExcel(logs, filename);
      case 'csv':
      default:
        return exportCSV(logs, filename);
    }
    
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Export as CSV
function exportCSV(logs, filename) {
  const headers = ['ID', 'User Email', 'User Name', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address', 'User Agent', 'Success', 'Timestamp'];
  
  const rows = logs.map(log => [
    log.id,
    log.user?.email || 'System',
    log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
    log.action,
    log.resourceType || '',
    log.resourceId || '',
    JSON.stringify(log.details || {}),
    log.ipAddress || 'Unknown',
    log.userAgent || 'Unknown',
    log.success ? 'Yes' : 'No',
    new Date(log.createdAt).toISOString()
  ]);
  
  const csvData = [headers, ...rows];
  const csvContent = csvData.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  
  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}.csv"`
    }
  });
}

// Export as Excel
function exportExcel(logs, filename) {
  const wb = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['Security Logs Export'],
    ['Generated:', new Date().toLocaleString()],
    ['Total Records:', logs.length],
    [''],
    ['Export Details'],
    ['Format', 'Excel'],
    ['Date Range', 'All'],
    ['User', 'All']
  ];
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
  
  // Data sheet
  const headers = ['ID', 'User Email', 'User Name', 'Action', 'Resource Type', 'Resource ID', 'Details', 'IP Address', 'User Agent', 'Success', 'Timestamp'];
  const rows = logs.map(log => [
    log.id,
    log.user?.email || 'System',
    log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
    log.action,
    log.resourceType || '',
    log.resourceId || '',
    JSON.stringify(log.details || {}),
    log.ipAddress || 'Unknown',
    log.userAgent || 'Unknown',
    log.success ? 'Yes' : 'No',
    new Date(log.createdAt).toISOString()
  ]);
  
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = headers.map((h, i) => ({ wch: Math.max(h.length, 20) }));
  
  XLSX.utils.book_append_sheet(wb, ws, 'Security Logs');
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  
  return new NextResponse(excelBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`
    }
  });
}

// Export as PDF
function exportPDF(logs, filename) {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(33, 33, 33);
  doc.text('Security Logs Report', pageWidth / 2, 20, { align: 'center' });
  
  // Timestamp
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
  
  // Company
  doc.setFontSize(12);
  doc.setTextColor(50, 50, 50);
  doc.text('Mikias Building Materials', pageWidth / 2, 37, { align: 'center' });
  
  // Summary
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(`Total Records: ${logs.length}`, 14, 45);
  
  // Table headers
  const headers = ['ID', 'User', 'Action', 'Resource', 'IP', 'Success', 'Timestamp'];
  const rows = logs.map(log => [
    log.id.slice(0, 8),
    log.user?.email || 'System',
    log.action || '',
    log.resourceType || '',
    log.ipAddress || 'Unknown',
    log.success ? '✓' : '✗',
    new Date(log.createdAt).toLocaleString()
  ]);
  
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 52,
    styles: {
      fontSize: 7,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 245, 250],
    },
    margin: { left: 14, right: 14 },
    pageBreak: 'auto',
  });
  
  // Footer
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Generated by Mikias Building Materials - Confidential`,
    pageWidth / 2,
    Math.min(finalY + 10, pageHeight - 10),
    { align: 'center' }
  );
  
  const pdfBuffer = doc.output('arraybuffer');
  
  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`
    }
  });
}