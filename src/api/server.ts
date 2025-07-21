import Fastify from 'fastify';

const fastify = Fastify({
  logger: true
});

// Enable CORS
fastify.register(require('@fastify/cors'), {
  origin: ['http://localhost:3000', 'https://localhost:3000'],
  credentials: true
});

// Dashboard endpoint
fastify.get('/api/dashboard', async (request, reply) => {
  return {
    stats: {
      totalEmissions: 2450,
      offsetCredits: 1850,
      certificates: 12,
      marketplaceTransactions: 8,
      emissionsChange: -12.5,
      offsetsChange: 23.8,
    },
    emissions: [
      { month: 'Jan', emissions: 2400, offsets: 1200, net: 1200 },
      { month: 'Feb', emissions: 2100, offsets: 1400, net: 700 },
      { month: 'Mar', emissions: 2800, offsets: 1600, net: 1200 },
      { month: 'Apr', emissions: 2200, offsets: 1800, net: 400 },
      { month: 'May', emissions: 2600, offsets: 2000, net: 600 },
      { month: 'Jun', emissions: 2450, offsets: 1850, net: 600 },
    ],
    recentActivity: [
      {
        id: '1',
        type: 'certificate',
        title: 'Certificate Minted',
        description: 'Q2 2024 Emissions Certificate',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        amount: 2450,
        txHash: '0x1234...5678',
      },
      {
        id: '2',
        type: 'purchase',
        title: 'Offset Credits Purchased',
        description: 'Renewable Energy Credits',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        status: 'completed',
        amount: 500,
        txHash: '0xabcd...efgh',
      },
    ],
  };
});

// Certificates endpoint
fastify.get('/api/certificates', async (request, reply) => {
  return [
    {
      id: 'GHG-2024-001',
      title: 'Q1 2024 Emissions Certificate',
      totalEmissions: 2450,
      status: 'verified',
      issueDate: '2024-04-15',
      validUntil: '2025-04-15',
      blockchainTx: '0x1234567890abcdef',
      categories: ['Energy', 'Transport', 'Waste'],
    },
    {
      id: 'GHG-2024-002',
      title: 'Q2 2024 Emissions Certificate',
      totalEmissions: 2180,
      status: 'verified',
      issueDate: '2024-07-15',
      validUntil: '2025-07-15',
      blockchainTx: '0xabcdef1234567890',
      categories: ['Energy', 'Transport'],
    },
  ];
});

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('API Server running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();