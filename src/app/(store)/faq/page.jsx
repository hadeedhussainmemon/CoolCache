'use client';

import React, { useMemo, useState } from 'react';

const faqs = [
  {
    question: "Do you offer open‑box delivery in Karachi?",
    answer: `Yes. We offer open‑box delivery across Karachi so you can inspect your items at the time of delivery. If something looks wrong, you can report it immediately and we’ll make it right.`
  },
  {
    question: "How do I place an order?",
    answer: `You can order in three ways:
1) Quick order (recommended): Add items to your cart and follow checkout instructions if available.
2) Message us: Click "Message us" to contact our support on Instagram with the product name/ID and quantity.
3) Phone / WhatsApp: If provided, use the contact number for direct ordering.

After you contact us we'll confirm availability, provide payment instructions, and arrange delivery.`
  },
  {
    question: "What payment methods do you accept?",
    answer: `We accept bank transfers and major local digital wallets. Payment details are sent when your order is confirmed. For large or wholesale orders we can provide invoice/payment terms on request.`
  },
  {
    question: "How long will delivery take?",
    answer: `Delivery times depend on your location and item type:
- Ready-made items: typically 2-7 business days within the country.
- Customized items: 7-21 business days depending on the request.

We’ll confirm an estimated delivery date after you place your order.`
  },
  {
    question: "Do you ship internationally?",
    answer: `Not by default. We primarily ship locally. If you need international shipping, message us with your country and postcode for a quote and custom duties guidance.`
  },
  {
    question: "Can I return or exchange an item?",
    answer: `We accept returns or exchanges on faulty or incorrect items if reported within 7 days of delivery. For hygiene reasons, some items (for example earbud tips, custom engraved pieces) may be non-returnable — we’ll note that on the product page when applicable. Contact us with photos and your order number to start a return.`
  },
  {
    question: "Do you offer customization or engraving?",
    answer: `Yes — many products are customizable (colors, text engravings, sizes). Custom work may require extra time and cost. Use the "Customize" option on the product page or message us with your requirements for a quote.`
  },
  {
    question: "Are product prices and stock accurate?",
    answer: `We update prices and stock frequently, but occasional mismatches can occur for fast-moving items. If an item is out of stock after you order, we will contact you to offer alternatives or a full refund.`
  },
  {
    question: "I'm a business — do you do wholesale?",
    answer: `Yes. We offer wholesale pricing for bulk orders. Please message us with your requirements (product IDs, quantities, and desired delivery schedule) and we’ll provide a commercial quote.`
  }
];

const faqLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer
    }
  }))
};

const breadcrumbLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.coolcache.app/' },
    { '@type': 'ListItem', position: 2, name: 'FAQ', item: 'https://www.coolcache.app/faq' }
  ]
};

const FAQPage = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const instagramUser = process.env.NEXT_PUBLIC_INSTAGRAM_USERNAME || 'coolcache.app';

  return (
    <section className="py-12 bg-gray-50 min-h-screen text-gray-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} 
          key="faq-jsonld"
        />
        <script 
          type="application/ld+json" 
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} 
          key="breadcrumb-jsonld"
        />
        
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Frequently Asked Questions
        </h1>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full text-left px-6 py-4 focus:outline-none hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">
                    {faq.question}
                  </h3>
                  <span className={`ml-6 flex-shrink-0 transition-transform duration-200 text-purple-600 font-bold ${openIndex === index ? 'rotate-180' : ''}`}>
                    ↓
                  </span>
                </div>
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 animate-fadeIn">
                  <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-600">
            Still have questions? We're here to help!
          </p>
          <a 
            href={`https://www.instagram.com/${instagramUser}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 text-purple-600 hover:text-purple-700 font-bold text-lg transition-colors"
          >
            Message us on Instagram →
          </a>
        </div>
      </div>
    </section>
  );
};

export default FAQPage;
