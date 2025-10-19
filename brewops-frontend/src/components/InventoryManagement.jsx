import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Link, useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { AiOutlineEdit } from 'react-icons/ai';
import { BsInfoCircle } from 'react-icons/bs';
import { FaLeaf, FaExclamationTriangle, FaBan } from 'react-icons/fa';
import Spinner from './Spinner';
import { MdOutlineAddBox } from 'react-icons/md';
import './inventoryManagement.css';

// Component for disabled edit button with hover red ban mark
const DisabledEditButton = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span 
        className="edit-link disabled" 
        title="Edit window expired (15 minutes)"
        style={{ cursor: 'not-allowed' }}
      >
        <AiOutlineEdit />
      </span>
      {isHovered && (
        <FaBan 
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            fontSize: '16px',
            color: '#ef4444',
            backgroundColor: 'white',
            borderRadius: '50%',
            padding: '2px',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  );
};

const Home = () => {
  const [originalInventory, setOriginalInventory] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [totalRawLeaves, setTotalRawLeaves] = useState(0);
  const previousTotalRef = useRef(null);
  const lowInventoryToastShown = useRef(false);
  const location = useLocation();

  // Send a notification to the server (will be picked up by production manager)
  const sendLowInventoryNotification = async (total) => {
    try {
      const token = localStorage.getItem('jwtToken');
      await axios.post('http://localhost:5000/api/notifications', {
        title: 'Low Raw Leaves Inventory',
        body: `Raw leaves inventory is below 10,000 kg. Current total: ${total} kg.`,
        // backend may accept additional fields like recipientRole or meta; adjust if needed
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to send low inventory notification:', error);
    }
  };

  useEffect(() => {
    setLoading(true);
  }, []);

  useEffect(() => {
    setLoading(true);
    axios.get('http://localhost:5000/api/manager/inventory')
      .then((response) => {
        let inventories = response.data.data || [];
        // If no data, use mock data
        if (!inventories.length) {
          inventories = [
            { id: 1, inventoryid: 'IN-2025-001', quantity: 3200, createdAt: '2025-09-01T09:30:00Z' },
            { id: 2, inventoryid: 'IN-2025-002', quantity: 4800, createdAt: '2025-09-05T14:15:00Z' },
            { id: 3, inventoryid: 'IN-2025-003', quantity: 1500, createdAt: '2025-09-10T11:00:00Z' },
            { id: 4, inventoryid: 'IN-2025-004', quantity: 900, createdAt: '2025-09-15T16:45:00Z' },
            { id: 5, inventoryid: 'IN-2025-005', quantity: 6000, createdAt: '2025-09-20T08:20:00Z' },
            { id: 6, inventoryid: 'IN-2025-006', quantity: 2500, createdAt: '2025-09-25T13:10:00Z' },
            { id: 7, inventoryid: 'IN-2025-007', quantity: 800, createdAt: '2025-09-28T10:00:00Z' },
          ];
          toast('Showing mock inventory data');
        }
        // sort newest first by createdAt
        inventories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOriginalInventory(inventories);
        setInventory(inventories);
        setVisibleCount(10);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
        // Use mock data on error
        const mockInventories = [
          { id: 1, inventoryid: 'IN-2025-001', quantity: 3200, createdAt: '2025-09-01T09:30:00Z' },
          { id: 2, inventoryid: 'IN-2025-002', quantity: 4800, createdAt: '2025-09-05T14:15:00Z' },
          { id: 3, inventoryid: 'IN-2025-003', quantity: 1500, createdAt: '2025-09-10T11:00:00Z' },
          { id: 4, inventoryid: 'IN-2025-004', quantity: 900, createdAt: '2025-09-15T16:45:00Z' },
          { id: 5, inventoryid: 'IN-2025-005', quantity: 6000, createdAt: '2025-09-20T08:20:00Z' },
          { id: 6, inventoryid: 'IN-2025-006', quantity: 2500, createdAt: '2025-09-25T13:10:00Z' },
          { id: 7, inventoryid: 'IN-2025-007', quantity: 800, createdAt: '2025-09-28T10:00:00Z' },
        ];
        setOriginalInventory(mockInventories);
        setInventory(mockInventories);
        setVisibleCount(10);
        setLoading(false);
        toast('Showing mock inventory data (offline mode)');
      });
  }, []);

  // Calculate total raw leaves whenever inventory changes
  useEffect(() => {
    if (inventory && inventory.length > 0) {
      const total = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
      setTotalRawLeaves(total);
      
      // Check if inventory is low and send notification
      if (total < 10000 && !lowInventoryToastShown.current) {
        toast(`Low inventory alert: ${total.toLocaleString()} kg raw leaves (below 10,000 kg target)`, {
          icon: '⚠️',
          style: {
            background: '#fef3c7',
            color: '#92400e',
            
          },
          duration: 5000,
        });
        lowInventoryToastShown.current = true;
        sendLowInventoryNotification(total);
      }
    } else {
      setTotalRawLeaves(0);
    }
  }, [inventory]);

  const handleSearch = () => {
    if (searchInput.trim() === '') {
      setInventory(originalInventory);
      setVisibleCount(10);
    } else {
      const filtered = originalInventory.filter(item =>
        item.inventoryid && item.inventoryid.toLowerCase().includes(searchInput.toLowerCase())
      );
      setInventory(filtered);
      setVisibleCount(10);
    }
  };

// Generate a PDF report for the selected month (or current month when none selected)
const handleReportGeneration = () => {
  try {
    const now = new Date();
    // Determine target month/year
    const targetMonthIndex = selectedMonth !== '' ? parseInt(selectedMonth, 10) : now.getMonth();
    const targetYear = now.getFullYear();

    const monthName = new Date(targetYear, targetMonthIndex).toLocaleString('default', { month: 'long' });
    const startDate = new Date(targetYear, targetMonthIndex, 1);
    // end of month: last millisecond of last day
    const endDate = new Date(targetYear, targetMonthIndex + 1, 0, 23, 59, 59, 999);

    // Filter inventories for the chosen month
    const monthInventories = originalInventory.filter(item => {
      if (!item.createdAt) return false;
      const itemDate = new Date(item.createdAt);
      return itemDate >= startDate && itemDate <= endDate;
    });

    if (monthInventories.length === 0) {
      toast.error(`No inventory records found for ${monthName} ${targetYear}.`);
      return;
    }

    // Calculate statistics
    const totalQuantity = monthInventories.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const averageQuantity = totalQuantity / monthInventories.length;
    const minQuantity = Math.min(...monthInventories.map(item => item.quantity || 0));
    const maxQuantity = Math.max(...monthInventories.map(item => item.quantity || 0));

    // Group by week for trend analysis (within the month)
    const weeklyData = {};
    monthInventories.forEach(item => {
      const itemDate = new Date(item.createdAt);
      const weekStart = new Date(itemDate);
      weekStart.setDate(itemDate.getDate() - itemDate.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { count: 0, totalQuantity: 0, items: [] };
      }
      weeklyData[weekKey].count++;
      weeklyData[weekKey].totalQuantity += item.quantity || 0;
      weeklyData[weekKey].items.push(item);
    });

    const doc = new jsPDF();
    let yPosition = 20;

    // Header with company branding
    doc.setFillColor(34, 197, 94); // Green color
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text('INVENTORY MANAGEMENT REPORT', 105, 20, { align: 'center' });

    // Report metadata
    yPosition = 45;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
  doc.text(`Report Period: ${monthName} ${targetYear}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Generated on: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`, 20, yPosition);
  yPosition += 8;
  doc.text(`Total Records: ${monthInventories.length}`, 20, yPosition);
    yPosition += 15;

    // Executive Summary Section
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPosition - 5, 180, 25, 'F');
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('EXECUTIVE SUMMARY', 20, yPosition + 5);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    yPosition += 15;
    
    doc.text(`• Total Inventory Quantity: ${totalQuantity.toLocaleString()} kg`, 25, yPosition);
    yPosition += 5;
    doc.text(`• Average Quantity per Entry: ${averageQuantity.toFixed(2)} kg`, 25, yPosition);
    yPosition += 5;
    doc.text(`• Highest Single Entry: ${maxQuantity.toLocaleString()} kg`, 25, yPosition);
    yPosition += 5;
    doc.text(`• Lowest Single Entry: ${minQuantity.toLocaleString()} kg`, 25, yPosition);
    yPosition += 15;

    // Weekly Trend Analysis
    if (Object.keys(weeklyData).length > 1) {
      doc.setFont(undefined, 'bold');
      doc.setFontSize(14);
      doc.text('WEEKLY TREND ANALYSIS', 20, yPosition);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      yPosition += 10;

      const weeklyHeaders = [['Week Starting', 'Entries', 'Total Quantity (kg)', 'Average (kg)']];
      const weeklyRows = Object.entries(weeklyData)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([weekStart, data]) => [
          new Date(weekStart).toLocaleDateString(),
          data.count.toString(),
          data.totalQuantity.toLocaleString(),
          (data.totalQuantity / data.count).toFixed(2)
        ]);

      autoTable(doc, {
        head: weeklyHeaders,
        body: weeklyRows,
        startY: yPosition,
        headStyles: { fillColor: [34, 197, 94], textColor: 255 },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { left: 20, right: 20 },
      });
      
      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Inventory Status Analysis
  const lowStock = monthInventories.filter(item => (item.quantity || 0) < 100);
  const mediumStock = monthInventories.filter(item => (item.quantity || 0) >= 100 && (item.quantity || 0) < 500);
  const highStock = monthInventories.filter(item => (item.quantity || 0) >= 500);

    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('INVENTORY STATUS DISTRIBUTION', 20, yPosition);
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    yPosition += 10;

    const statusHeaders = [['Status Category', 'Count', 'Percentage', 'Total Quantity (kg)']];
    const statusRows = [
      ['Low Stock (< 100 kg)', lowStock.length.toString(), `${((lowStock.length/monthInventories.length)*100).toFixed(1)}%`, lowStock.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString()],
      ['Medium Stock (100-499 kg)', mediumStock.length.toString(), `${((mediumStock.length/monthInventories.length)*100).toFixed(1)}%`, mediumStock.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString()],
      ['High Stock (≥ 500 kg)', highStock.length.toString(), `${((highStock.length/monthInventories.length)*100).toFixed(1)}%`, highStock.reduce((sum, item) => sum + (item.quantity || 0), 0).toLocaleString()]
    ];

    autoTable(doc, {
      head: statusHeaders,
      body: statusRows,
      startY: yPosition,
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 20, right: 20 },
    });
    
    yPosition = doc.lastAutoTable.finalY + 15;

    // Check if we need a new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    // Detailed Inventory Records
    doc.setFont(undefined, 'bold');
    doc.setFontSize(14);
    doc.text('DETAILED INVENTORY RECORDS', 20, yPosition);
    yPosition += 10;

    const detailedHeaders = [['#', 'Inventory ID', 'Quantity (kg)', 'Date Created', 'Status']];
    const detailedRows = monthInventories
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((item, index) => {
        let status = 'High Stock';
        if ((item.quantity || 0) < 100) status = 'Low Stock';
        else if ((item.quantity || 0) < 500) status = 'Medium Stock';
        
        return [
          (index + 1).toString(),
          item.inventoryid || 'N/A',
          (item.quantity || 0).toLocaleString(),
          item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'N/A',
          status
        ];
      });

    autoTable(doc, {
      head: detailedHeaders,
      body: detailedRows,
      startY: yPosition,
      headStyles: { fillColor: [34, 197, 94], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 20, right: 20 },
      styles: { fontSize: 9 },
      columnStyles: {
        0: { cellWidth: 15 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 35 },
        4: { cellWidth: 25 }
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Generated by Inventory Management System | Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text('This report is confidential and for internal use only', 105, 285, { align: 'center' });
    }

    // Save the PDF with a descriptive filename
  const fileName = `Inventory_Report_${targetYear}-${String(targetMonthIndex + 1).padStart(2, '0')}.pdf`;
    doc.save(fileName);
    
  toast.success(`Report generated successfully! Found ${monthInventories.length} records for ${monthName} ${targetYear}.`);
    
  } catch (error) {
    console.error('Error generating modern PDF report:', error);
    toast.error('Failed to generate report. Please try again.');
  }
};

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
    if (e.target.value) {
      const filtered = originalInventory.filter(item => {
        const itemDate = new Date(item.createdAt);
        return itemDate.getMonth() === parseInt(e.target.value);
      });
      setInventory(filtered);
      setVisibleCount(10);
    } else {
      setInventory(originalInventory);
      setVisibleCount(10);
    }
  };

  // Sorting helper intentionally removed (unused). Re-add if client-side sorting is required.

  useEffect(() => {
    // Calculate total raw leaves inventory
    const total = originalInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    setTotalRawLeaves(total);

    // Check if inventory is below threshold and avoid duplicate notifications
  if (total < 10000 && previousTotalRef.current !== null && total !== previousTotalRef.current) {
      // Send notification to production manager via backend
      sendLowInventoryNotification(total);
      // Show a local toast once for this low-inventory event
      if (!lowInventoryToastShown.current) {
        toast.error('Warning: Raw leaves inventory is below 10,000 kg! Notify the production manager.');
        lowInventoryToastShown.current = true;
      }
    }

    // Reset the local-toast flag if inventory recovers above threshold
    if (total >= 10000 && lowInventoryToastShown.current) {
      lowInventoryToastShown.current = false;
    }

  // Update previous total after all checks
  previousTotalRef.current = total;
  }, [originalInventory]);

  // Helper to check if an item is editable (within 15 minutes of creation)
  const isEditable = (createdAt) => {
    if (!createdAt) return false;
    const created = new Date(createdAt);
    const now = new Date();
    const diffMs = now - created;
    const diffMinutes = diffMs / (1000 * 60);
    return diffMinutes <= 15;
  };


  return (
  <div className="inventory-page">
      {/* Layout with Sidebar */}
      <div className="flex flex-1">

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          <div className="inventory-header">
            <h1 className="inventory-title">Inventory Management</h1>
            <div className="inventory-actions">
              <input
                type="text"
                placeholder="Search by Inventory Number..."
                className="input"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <button onClick={handleSearch} className="im-btn im-btn-primary">Search</button>
              <button onClick={handleReportGeneration} className="im-btn im-btn-primary">Generate Report</button>
              <Link to="/create-inventory" state={{ background: location }} className="im-btn im-btn-primary im-btn-wide">
                <MdOutlineAddBox style={{ marginRight: 8 }} /> Add Inventory
              </Link>
            </div>
          </div>

          {/* Inventory Overview Cards */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {/* Current Raw Materials Card */}
              <div style={{ 
                backgroundColor: 'white', 
                padding: '24px', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                minWidth: '280px',
                flex: '1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <FaLeaf style={{ color: '#10b981', fontSize: '24px' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>Current Raw Materials</h3>
                </div>
                <p style={{ margin: 0, fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>
                  {loading ? '...' : `${totalRawLeaves.toLocaleString()} kg`}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                  Tea leaves in stock ({inventory?.length || 0} entries)
                </p>
              </div>

              {/* Minimum Required Card */}
              <div style={{ 
                backgroundColor: 'white', 
                padding: '24px', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                minWidth: '280px',
                flex: '1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <FaExclamationTriangle style={{ 
                    color: totalRawLeaves < 10000 ? '#ef4444' : '#f59e0b', 
                    fontSize: '24px' 
                  }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>
                    {totalRawLeaves < 10000 ? 'Required to Reach Target' : 'Above Target Level'}
                  </h3>
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: '32px', 
                  fontWeight: 'bold', 
                  color: totalRawLeaves < 10000 ? '#ef4444' : '#f59e0b'
                }}>
                  {loading ? '...' : totalRawLeaves < 10000 
                    ? `${(10000 - totalRawLeaves).toLocaleString()} kg` 
                    : `+${(totalRawLeaves - 10000).toLocaleString()} kg`
                  }
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                  {totalRawLeaves < 10000 
                    ? `Target: 10,000 kg (${((totalRawLeaves/10000)*100).toFixed(1)}% achieved)`
                    : `Exceeds target by ${((totalRawLeaves/10000-1)*100).toFixed(1)}%`
                  }
                </p>
              </div>

              {/* Inventory Status Card */}
              <div style={{ 
                backgroundColor: 'white', 
                padding: '24px', 
                borderRadius: '12px', 
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
                border: '1px solid #e5e7eb',
                minWidth: '280px',
                flex: '1'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: totalRawLeaves >= 10000 ? '#10b981' : totalRawLeaves >= 5000 ? '#f59e0b' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: 'white' 
                    }}></div>
                  </div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#374151' }}>Inventory Status</h3>
                </div>
                <p style={{ 
                  margin: 0, 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  color: totalRawLeaves >= 10000 ? '#10b981' : totalRawLeaves >= 5000 ? '#f59e0b' : '#ef4444'
                }}>
                  {totalRawLeaves >= 10000 ? '✓ Optimal' : totalRawLeaves >= 5000 ? '⚠ Low' : '⚠ Critical'}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                  {totalRawLeaves >= 10000 
                    ? 'Inventory levels are healthy'
                    : totalRawLeaves >= 5000 
                    ? 'Consider restocking soon'
                    : 'Immediate restocking required'
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="filters">
            <div>
              <label htmlFor="month" className="filter-label">Select Month:</label>
              <select id="month" value={selectedMonth} onChange={handleMonthChange} className="select">
                <option value="">All</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>
            </div>


          </div>

          {loading ? (
            <Spinner />
          ) : (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)', border: '1px solid #e5e7eb' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#1f2937' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>No</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Inventory ID</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Quantity (kg)</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date Created</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {inventory.slice(0, visibleCount).map((item, index) => (
                    <tr key={item.id} style={{ borderTop: index > 0 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{index + 1}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151', fontWeight: '500' }}>{item.inventoryid ?? '-'}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{item.quantity ?? '-'}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</td>
                      <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>
                        <div className="action-links">
                          <Link to={`/inventory/${item.id}`} state={{ background: location }} className="info-link"><BsInfoCircle /></Link>
                          {isEditable(item.createdAt) ? (
                            <Link to={`/inventory/edit/${item.id}`} state={{ background: location }} className="edit-link"><AiOutlineEdit /></Link>
                          ) : (
                            <DisabledEditButton />
                          )}
                          
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {inventory.length > visibleCount && (
            <div className="show-more-container">
              <button
                onClick={() => setVisibleCount((c) => Math.min(c + 10, inventory.length))}
                className="im-btn im-btn-primary show-more-btn"
              >
                Show more
              </button>
            </div>
          )}

          {/* Chart removed per request */}
        </main>
      </div>
      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
};

export default Home;