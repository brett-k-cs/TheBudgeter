import { Request, Response, Router } from 'express';

import { Parser } from 'json2csv';
import PDFDocument from 'pdfkit';
import { create } from 'xmlbuilder2';

import { Transaction } from '../models/transaction.js';

const router = Router();

router.get('/', async (req, res) => {
  console.log('Fetching transactions for user:', req.user!.id);
  
  const transactions = await Transaction.findAll({
    order: [['date', 'DESC']],
    attributes: ['id', 'type', 'amount', 'category', 'description', 'date', 'createdAt', 'updatedAt'],
    where: { 
      userId: req.user!.id,
    },
  });

  res.json({ success: true, data: transactions });
});

interface TransactionRequestBody {
  type: 'withdrawal' | 'deposit';
  amount: number;
  description: string;
  category: string;
  date: string; // ISO date string
}

router.post('/', async (req: Request<{}, {}, TransactionRequestBody>, res: Response) => {
  const { type, amount, description, category, date } = req.body;
  if (!type || !amount || !description || !category || !date) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const userId = req.user!.id;

  // further validation e.g. typeof checks
  if (typeof type !== 'string' || typeof description !== 'string' || typeof amount !== 'number' || typeof category !== 'string') {
    res.status(400).json({ error: 'Invalid data types' });
    return;
  }

  if (type !== 'withdrawal' && type !== 'deposit') {
    res.status(400).json({ error: 'Invalid transaction type' });
    return;
  }

  if (amount <= 0) {
    res.status(400).json({ error: 'Amount must be greater than zero' });
    return;
  }

  try {
    // Create the transaction
    const transaction = await Transaction.create({
      userId,
      type,
      amount,
      category,
      description,
      date: new Date(date), // Convert ISO string to Date object
    });
    res.status(201).json({ message: "Success!", data: transaction });
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
    return;
  }
});

router.put('/:id', async (req: Request<{ id: string }, {}, TransactionRequestBody>, res: Response) => {
  const transactionId = parseInt(req.params.id, 10);
  if (isNaN(transactionId)) {
    res.status(400).json({ error: 'Invalid transaction ID' });
    return;
  }
  const { type, amount, description, category, date } = req.body;
  if (!type || !amount || !description || !category || !date) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const userId = req.user!.id;

  // further validation e.g. typeof checks
  if (typeof type !== 'string' || typeof description !== 'string' || typeof amount !== 'number' || typeof category !== 'string') {
    res.status(400).json({ error: 'Invalid data types' });
    return;
  }

  if (type !== 'withdrawal' && type !== 'deposit') {
    res.status(400).json({ error: 'Invalid transaction type' });
    return;
  }

  if (amount <= 0) {
    res.status(400).json({ error: 'Amount must be greater than zero' });
    return;
  }

  const result = await Transaction.update(
    {
      type,
      amount,
      category,
      description,
      date: new Date(date), // Convert ISO string to Date object
    },
    {
      where: {
        id: transactionId,
        userId,
      },
    }
  );

  if (result[0] === 0) {
    res.status(404).json({ error: 'Transaction not found or does not belong to the user' });
    return;
  }

  const updatedTransaction = await Transaction.findByPk(transactionId, {
    attributes: ['id', 'type', 'amount', 'category', 'description', 'date'],
  });
  res.json({ success: true, data: updatedTransaction });
});

router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  const transactionId = parseInt(req.params.id, 10);
  if (isNaN(transactionId)) {
    res.status(400).json({ error: 'Invalid transaction ID' });
    return;
  }
  try {
    const transaction = await Transaction.findByPk(transactionId);
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }

    // Check if the transaction belongs to the user
    if (transaction.userId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    await transaction.destroy();
    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete transactions in bulk
router.delete('/', async (req: Request<{}, {}, { ids: number[] }>, res: Response) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'Invalid IDs format' });
    return;
  }

  try {
    // Find all transactions that match the IDs and belong to the user
    const transactions = await Transaction.findAll({
      where: {
        id: ids,
        userId: req.user!.id,
      },
      limit: 1, // Limit to 1 to check if any exist
    });

    if (transactions.length === 0) {
      res.status(404).json({ error: 'No transactions found for the provided IDs' });
      return;
    }

    // Delete all found transactions
    await Transaction.destroy({
      where: {
        id: ids,
        userId: req.user!.id,
      },
    });

    res.json({ message: 'Transactions deleted successfully' });
  } catch (error) {
    console.error('Error deleting transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/import', async (req: Request<{}, {}, { data: TransactionRequestBody[] }>, res: Response) => {
  const { data } = req.body;
  if (!Array.isArray(data) || data.length === 0) {
    res.status(400).json({ error: 'Invalid data format' });
    return;
  }

  try {
    const transactions = await Transaction.bulkCreate(data.map(item => ({
      userId: req.user!.id,
      type: item.type,
      amount: item.amount,
      category: item.category,
      description: item.description,
      date: new Date(item.date), // Convert ISO string to Date object
    })));

    res.status(201).json({ message: "Success!", data: transactions });
  } catch (error) {
    console.error('Error importing transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


interface ExportConfig {
  format: 'json' | 'csv' | 'xml' | 'pdf';
  fields: {
    [key: string]: string; // key: field name, value: display name
  };
  csvDelimiter?: string;
  dateFormat?: string;
  includeHeaders?: boolean;
  xmlRootElement?: string;
  xmlItemElement?: string;
  pdfTitle?: string;
  pdfOrientation?: 'portrait' | 'landscape';
  [key: string]: any; // Additional fields for future expansion
}

router.post('/export', async (req: Request<{}, {}, ExportConfig>, res: Response) => {
  const {
    format,
    fields = {
      'date': 'Date',
      'description': 'Description',
      'category': 'Category',
      'type': 'Type',
      'amount': 'Amount',
      'createdAt': 'Created At',
      'updatedAt': 'Updated At',      
    },
    csvDelimiter = ',',
    dateFormat = 'YYYY-MM-DD',
    includeHeaders = true,
    xmlRootElement = 'transactions',
    xmlItemElement = 'transaction',
    pdfTitle = 'Transaction Report',
    pdfOrientation = 'portrait'
  } = req.body;

  if (!format || !['json', 'csv', 'xml', 'pdf'].includes(format)) {
    res.status(400).json({ error: 'Invalid or missing format' });
    return;
  }

  try {
    // Fetch transactions for the user
    const transactions = await Transaction.findAll({
      order: [['date', 'DESC']],
      attributes: ['id', 'type', 'amount', 'category', 'description', 'date', 'createdAt', 'updatedAt'],
      where: { 
        userId: req.user!.id,
      },
    });

    if (transactions.length === 0) {
      res.status(404).json({ error: 'No transactions found' });
      return;
    }

    // Transform data based on configuration
    const transformedData = transactions.map(transaction => {
      const data = transaction.toJSON();
      const filtered : { [key: string]: any } = {};

      Object.keys(fields).forEach(field => {
        if (field in data) {
          let key = field;
          let value = data[field as keyof typeof data];

          // Apply key naming
          switch (key) {
            case 'date':
            case 'createdAt':
            case 'updatedAt':
              // Format date if specified
              value = formatDate(new Date(value as string), dateFormat);
              break;
            case 'type':
              // Convert type to a more readable format if needed
              value = value === 'withdrawal' ? 'Withdrawal' : 'Deposit';
              break;
          }

          if (fields[field]) {
            key = fields[field];
          }

          filtered[key] = value;
        }
      });

      return filtered;
    });

    // Generate export based on format
    switch (format) {
      case 'json':
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="transactions.json"');
        res.json(transformedData);
        break;

      case 'csv':
        const parser = new Parser({ 
          delimiter: csvDelimiter,
          header: includeHeaders,
          fields: Object.values(fields)
        });

        const csv = parser.parse(transformedData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="transactions.csv"');
        res.send(csv);
        break;

      case 'xml':
        const xmlObj: any = {};
        xmlObj[xmlRootElement] = {};
        xmlObj[xmlRootElement][xmlItemElement] = transformedData;
        
        const xmlDoc = create(xmlObj);
        const xml = xmlDoc.end({ prettyPrint: true });
        
        res.setHeader('Content-Type', 'application/xml');
        res.setHeader('Content-Disposition', 'attachment; filename="transactions.xml"');
        res.send(xml);
        break;

      case 'pdf':
        const doc = new PDFDocument({ 
          size: 'A4', 
          layout: pdfOrientation as 'portrait' | 'landscape'
        });
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="transactions.pdf"');
        
        doc.pipe(res);
        
        // PDF Title
        doc.fontSize(16).text(pdfTitle, { align: 'center' });
        doc.moveDown();
        
        // Table headers
        const headers = Object.values(fields);
        
        doc.fontSize(10);
        const startX = 50;
        const startY = doc.y;
        const columnWidth = (doc.page.width - 100) / headers.length;
        
        // Draw headers
        headers.forEach((header, index) => {
          doc.text(header, startX + (index * columnWidth), startY, { 
            width: columnWidth, 
            align: 'left' 
          });
        });
        
        doc.moveDown();
        
        // Draw data rows
        transformedData.forEach((row, rowIndex) => {
          const y = doc.y;
          headers.forEach((header, colIndex) => {
            let value = row[header] || '';
            if (doc.widthOfString(value) > columnWidth) {
              while (doc.widthOfString(value + "...") > (columnWidth - 8)) {
                value = value.substring(0, value.length - 2);
              }
              value += '...';
            }

            doc.text(String(value), startX + (colIndex * columnWidth), y, { 
              width: columnWidth, 
              align: 'left' 
            });
          });
          doc.moveDown(0.5);
          
          // Add new page if needed
          if (doc.y > doc.page.height - 100) {
            doc.addPage();
          }
        });
        
        doc.end();
        break;

      default:
        res.status(400).json({ error: 'Unsupported format' });
    }
  } catch (error) {
    console.error('Error exporting transactions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to format dates
function formatDate(date: Date, format: string): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export const transactionsRouter = router;