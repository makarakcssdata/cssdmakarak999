import { Product, StockInTransaction, StockOutTransaction, GoogleSheetConfig } from '../types';

export const googleSheetsService = {
  /**
   * Create a new Google Spreadsheet in the user's Drive with 3 formatted worksheets:
   * 1. Products (สินค้าคงเหลือ)
   * 2. StockIn (ประวัติการรับเข้า)
   * 3. StockOut (ประวัติการเบิกออก)
   */
  async createSpreadsheet(accessToken: string, title = 'Inventory CSSD Makarak'): Promise<{ id: string; url: string }> {
    const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title: `${title} - คลังพัสดุและเวชภัณฑ์ (${new Date().toLocaleDateString('th-TH')})`,
        },
        sheets: [
          {
            properties: {
              title: 'Products',
              gridProperties: { rowCount: 1000, columnCount: 15, frozenRowCount: 1 },
              tabColor: { red: 0.1, green: 0.6, blue: 0.4 },
            },
          },
          {
            properties: {
              title: 'StockIn',
              gridProperties: { rowCount: 1000, columnCount: 15, frozenRowCount: 1 },
              tabColor: { red: 0.15, green: 0.4, blue: 0.8 },
            },
          },
          {
            properties: {
              title: 'StockOut',
              gridProperties: { rowCount: 1000, columnCount: 15, frozenRowCount: 1 },
              tabColor: { red: 0.85, green: 0.3, blue: 0.2 },
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'ไม่สามารถสร้าง Google Sheet ได้ กรุณาตรวจสอบสิทธิ์บัญชี Google');
    }

    const data = await response.json();
    const spreadsheetId = data.spreadsheetId;
    const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    return { id: spreadsheetId, url: spreadsheetUrl };
  },

  /**
   * Sync all data (Products, StockIn, StockOut) to Google Sheet using batchUpdate Values API
   */
  async syncToGoogleSheet(
    accessToken: string,
    spreadsheetId: string,
    products: Product[],
    stockIn: StockInTransaction[],
    stockOut: StockOutTransaction[]
  ): Promise<boolean> {
    const productHeaders = [
      'รหัสสินค้า',
      'ชื่อสินค้า',
      'ประเภทสินค้า',
      'หน่วย',
      'ราคาต่อหน่วย (บาท)',
      'จำนวนคงเหลือ',
      'รวมมูลค่าคงเหลือ (บาท)',
      'จุดสั่งซื้อขั้นต่ำ (Reorder)',
      'สถานะสต๊อก',
      'ตำแหน่งจัดเก็บ',
      'หมายเหตุ',
      'อัปเดตล่าสุด',
    ];

    const productRows = products.map((p) => {
      let status = 'ปกติ';
      if (p.quantity === 0) status = 'หมดสต๊อก';
      else if (p.quantity <= p.minStock) status = 'ใกล้หมด';

      return [
        p.code,
        p.name,
        p.category,
        p.unit,
        p.price,
        p.quantity,
        p.totalPrice || p.quantity * p.price,
        p.minStock,
        status,
        p.location || '-',
        p.notes || '',
        new Date(p.updatedAt || p.createdAt).toLocaleString('th-TH'),
      ];
    });

    const stockInHeaders = [
      'รหัสรายการ',
      'วันที่-เวลา รับเข้า',
      'รหัสสินค้า',
      'ชื่อสินค้า',
      'ประเภทสินค้า',
      'จำนวนรับเข้า',
      'หน่วย',
      'ราคาทุนต่อหน่วย (บาท)',
      'ยอดเงินซื้อรวม (บาท)',
      'ผู้รับเข้า',
      'ผู้จำหน่าย / Supplier',
      'เลขที่เอกสาร / PO',
      'หมายเหตุ',
    ];

    const stockInRows = stockIn.map((item) => [
      item.id,
      new Date(item.date).toLocaleString('th-TH'),
      item.productCode,
      item.productName,
      item.category,
      item.quantity,
      item.unit,
      item.unitCost,
      item.totalCost,
      item.receiverName,
      item.supplier || '-',
      item.documentNo || '-',
      item.notes || '',
    ]);

    const stockOutHeaders = [
      'รหัสรายการ',
      'วันที่-เวลา ที่เบิก',
      'รหัสสินค้า',
      'ชื่อสินค้า',
      'ประเภทสินค้า',
      'จำนวนที่เบิก',
      'หน่วย',
      'ราคาต่อหน่วย (บาท)',
      'ยอดเงินเบิกรวม (บาท)',
      'ผู้เบิก',
      'แผนก / ฝ่าย',
      'วัตถุประสงค์การเบิก',
      'หมายเหตุ',
    ];

    const stockOutRows = stockOut.map((item) => [
      item.id,
      new Date(item.date).toLocaleString('th-TH'),
      item.productCode,
      item.productName,
      item.category,
      item.quantity,
      item.unit,
      item.price,
      item.totalAmount,
      item.recipientName,
      item.department,
      item.purpose || '-',
      item.notes || '',
    ]);

    // Clear and write sheets using Sheets API batchUpdate values
    const dataPayload = [
      {
        range: 'Products!A1:L' + Math.max(productRows.length + 1, 50),
        values: [productHeaders, ...productRows],
      },
      {
        range: 'StockIn!A1:M' + Math.max(stockInRows.length + 1, 50),
        values: [stockInHeaders, ...stockInRows],
      },
      {
        range: 'StockOut!A1:M' + Math.max(stockOutRows.length + 1, 50),
        values: [stockOutHeaders, ...stockOutRows],
      },
    ];

    // Clear old ranges first to avoid trailing rows
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchClear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ranges: ['Products!A1:Z5000', 'StockIn!A1:Z5000', 'StockOut!A1:Z5000'],
        }),
      });
    } catch {
      // ignore clear error
    }

    const updateResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          valueInputOption: 'USER_ENTERED',
          data: dataPayload,
        }),
      }
    );

    if (!updateResponse.ok) {
      const err = await updateResponse.json().catch(() => ({}));
      throw new Error(err?.error?.message || 'การส่งข้อมูลไปยัง Google Sheets ล้มเหลว');
    }

    return true;
  },

  /**
   * Sync via Google Apps Script Web App Endpoint if configured
   */
  async syncViaAppsScript(
    appsScriptUrl: string,
    products: Product[],
    stockIn: StockInTransaction[],
    stockOut: StockOutTransaction[]
  ): Promise<boolean> {
    const response = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action: 'syncAll',
        products,
        stockIn,
        stockOut,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error('ไม่สามารถเชื่อมต่อ Apps Script URL ได้');
    }

    return true;
  },
};
