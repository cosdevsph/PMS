import React from 'react';
import { DocCallout } from '../DocCallout';

import Screenshot30_1 from '@/assets/manual/Chapter 30/Screenshot 30.1.webp';
import Screenshot30_2 from '@/assets/manual/Chapter 30/Screenshot 30.2.webp';
import Screenshot30_3 from '@/assets/manual/Chapter 30/Screenshot 30.3.webp';
import Screenshot30_4 from '@/assets/manual/Chapter 30/Screenshot 30.4.webp';

const Chapter30: React.FC = () => {
  return (
    <>
      <p className="text-xl text-gray-500 font-body mb-8">
        Learn how to add products and supplies, keep stock levels up to date, and use the low-stock indicators to know when to reorder.
      </p>

      {/* QUICK OVERVIEW FLOW */}
      <div className="bg-sky-50 border-l-4 border-sky-500 p-6 md:p-8 rounded-r-2xl mb-12">
        <h3 className="text-xl font-bold text-sky-900 mb-2">Inventory Overview</h3>
        <p className="text-gray-700 font-body mb-6">
          Inventory keeps a list of the items your clinic sells or uses, with the quantity in stock for each:
        </p>

        <div className="bg-white p-5 rounded-xl border border-sky-100 shadow-[0_4px_12px_rgb(14,165,233,0.1)] text-center">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Inventory Flow</p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 font-mono">
            <span className="px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 font-medium">30.1 Inventory Screen</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">30.2 Add a Product</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-sky-50 text-sky-800 rounded-lg border border-sky-200 font-medium">30.3 Adjust Stock</span>
            <span className="text-sky-400 font-bold">→</span>
            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-300 font-bold">30.4 Low-Stock Indicators</span>
          </div>
        </div>
      </div>


      {/* SECTION 30.1 — The Inventory Screen */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-12 mb-4 border-b border-gray-100 pb-2">
        30.1 The Inventory Screen
      </h3>
      <p className="text-gray-700 font-body mb-6">Every item with its stock at a glance.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Go to <strong>Setup</strong> and click <strong>Inventory</strong> in the <strong>Items</strong> card. The top of the page shows five tiles: <strong>Total Products</strong>, <strong>Active</strong>, <strong>Low Stock</strong>, <strong>Archived</strong> and <strong>Stock Value</strong>.
          </p>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            The table lists each item with its <strong>Name</strong>, <strong>SKU</strong>, <strong>Type</strong> (Product, Service or Supply), <strong>Sale Price</strong>, <strong>Stock</strong>, <strong>Unit</strong> and who last changed it. Search by name, SKU or barcode, and click <strong>Show Archived</strong> to include archived items. The icons at the end of each row adjust stock, edit or archive the item.
          </p>

          <DocCallout type="tip" title="Who can use inventory">
            By default the Owner and Branch Manager can add and change items. Front Desk can only view the screen, and Practitioner and Finance users cannot open it.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot30_1}
              width={3420}
              height={2002}
              decoding="async"
              alt="Screenshot 30.1: Inventory screen with the low-stock banner"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 30.2 — Adding a Product */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        30.2 Adding a Product
      </h3>
      <p className="text-gray-700 font-body mb-6">Create an item and set its first stock.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <ol className="list-decimal pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>Click <strong>New Product</strong>.</li>
            <li>Enter the <strong>Product Name</strong> and choose the <strong>Type</strong>.</li>
            <li>Enter the <strong>Sale Price</strong> (required) and, if you want a margin preview, the <strong>Cost Price</strong>.</li>
            <li>Optionally add a <strong>SKU</strong>, which is shown on invoices, and choose the <strong>Unit</strong> (pieces, box, bottle and so on).</li>
            <li>Enter the <strong>Initial Stock</strong> and the <strong>Min. Quantity</strong>, the level at which the item counts as low stock.</li>
            <li>Open <strong>Advanced</strong> if you want to add a <strong>Description</strong> or set the <strong>Status</strong>, then click <strong>Create Product</strong>.</li>
          </ol>

          <DocCallout type="important" title="Set a minimum quantity">
            An item counts as low stock when its stock is at or below <strong>Min. Quantity</strong>. With the default of 0, an item that has run out is the only one flagged. Set a number above 0 to be warned early.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot30_2}
              width={1440}
              height={1317}
              decoding="async"
              loading="lazy"
              alt="Screenshot 30.2: New Product form"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 30.3 — Adjusting Stock */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        30.3 Adjusting Stock
      </h3>
      <p className="text-gray-700 font-body mb-6">Record stock coming in and going out.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click the <strong>Adjust stock</strong> icon in a row. The window shows the <strong>Current Stock</strong> and four actions:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li><strong>Add Stock:</strong> received new stock.</li>
            <li><strong>Remove Stock:</strong> used or dispensed.</li>
            <li><strong>Set Quantity:</strong> correct the stock to an exact number.</li>
            <li><strong>Return:</strong> returned to stock.</li>
          </ul>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Enter the <strong>Quantity</strong>. The <strong>After adjustment</strong> line shows the result before you save. Add a <strong>Reference</strong> (for example a purchase order or invoice number) and a <strong>Comment</strong> if useful, then click <strong>Save Adjustment</strong>. Stock cannot go below zero.
          </p>

          <DocCallout type="info" title="Items on invoices">
            When you add an item to an invoice, Malasakit searches inventory and shows the stock on hand. Saving the invoice removes the sold quantity from stock.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot30_3}
              width={992}
              height={1586}
              decoding="async"
              loading="lazy"
              alt="Screenshot 30.3: Adjust Stock window"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 30.4 — Low-Stock Indicators */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        30.4 Low-Stock Indicators
      </h3>
      <p className="text-gray-700 font-body mb-6">How Malasakit tells you an item is running low.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            When one or more items are at or below their minimum, Malasakit shows it in four places:
          </p>

          <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body mb-6">
            <li>The <strong>Low Stock</strong> tile turns red and shows the count.</li>
            <li>A red banner reads <em>items are running low on stock</em> with a <strong>View low stock items</strong> link.</li>
            <li>A red warning triangle appears next to the item name.</li>
            <li>The stock number is shown in red.</li>
          </ul>

          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click <strong>View low stock items</strong> to show only those items. A <strong>Low Stock Only</strong> chip appears; click its × to see all items again.
          </p>

          <DocCallout type="warning" title="On-screen only">
            Low stock is shown on this screen only. Malasakit does not send email or SMS reminders about low stock, so open <strong>Inventory</strong> regularly to check.
          </DocCallout>

          <div className="mt-6 w-full flex justify-center bg-clinical-cloud/60 border border-gray-200 rounded-2xl overflow-hidden p-2 sm:p-3 shadow-sm">
            <img
              src={Screenshot30_4}
              width={3420}
              height={2002}
              decoding="async"
              loading="lazy"
              alt="Screenshot 30.4: Inventory filtered to low-stock items"
              className="w-full max-h-[500px] object-contain rounded-lg"
            />
          </div>
        </div>
      </div>


      {/* SECTION 30.5 — Archiving Products */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        30.5 Archiving Products
      </h3>
      <p className="text-gray-700 font-body mb-6">Hide items you no longer stock.</p>

      <div className="space-y-8">
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.04)] border border-gray-100 p-6 md:p-8">
          <p className="text-gray-700 font-body leading-relaxed mb-4">
            Click the <strong>Archive</strong> icon in a row to remove an item from the active list without deleting it. Click <strong>Show Archived</strong> to see archived items and use <strong>Restore</strong> to bring one back.
          </p>
        </div>
      </div>


      {/* CHAPTER SUMMARY */}
      <h3 className="text-2xl font-semibold text-trust-harbor font-heading mt-16 mb-4 border-b border-gray-100 pb-2">
        Summary
      </h3>
      <p className="text-gray-700 font-body leading-relaxed mb-4">
        In this chapter, you learned how to manage inventory in Malasakit PMS. You should now understand:
      </p>
      <ul className="list-disc pl-6 space-y-2 text-gray-700 font-body">
        <li>How to open <strong>Inventory</strong> from <strong>Setup &gt; Items</strong> and read the tiles and table.</li>
        <li>How to <strong>add a product</strong> with a price, unit, stock and minimum quantity.</li>
        <li>How to <strong>adjust stock</strong> with Add, Remove, Set Quantity and Return.</li>
        <li>How the <strong>low-stock indicators</strong> work, and that they appear on screen only.</li>
        <li>How to <strong>archive and restore</strong> items.</li>
      </ul>
    </>
  );
};

export default Chapter30;
