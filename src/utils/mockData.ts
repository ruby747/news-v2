export interface Topic {
  id: number;
  rank: number;
  title: string;
  explanation: string;
}
export interface Article {
  id: number;
  title: string;
  summary: string;
  content: string;
  source: string;
  sourceIcon: string;
  url: string;
  thumbnail: string;
  publishedAt: string;
  topicId: number;
  clusterId: string;
  clusterTitle: string;
}
export const mockTopics: Topic[] = [{
  id: 1,
  rank: 1,
  title: 'Climate Change Summit',
  explanation: 'Trending due to the ongoing COP28 conference with significant policy announcements from major nations.'
}, {
  id: 2,
  rank: 2,
  title: 'Tech Layoffs',
  explanation: 'Recent announcements of major layoffs at several tech giants have sparked concerns about industry stability.'
}, {
  id: 3,
  rank: 3,
  title: 'Cryptocurrency Regulation',
  explanation: 'New regulatory frameworks proposed by multiple countries affecting digital currency markets.'
}, {
  id: 4,
  rank: 4,
  title: 'Healthcare Reform',
  explanation: 'Legislative debates on healthcare policy changes have intensified following recent studies.'
}, {
  id: 5,
  rank: 5,
  title: 'Space Exploration',
  explanation: "Recent breakthrough in private space missions and NASA's new discovery on Mars."
}, {
  id: 6,
  rank: 6,
  title: 'Global Supply Chain',
  explanation: 'Ongoing disruptions affecting consumer goods prices and availability worldwide.'
}, {
  id: 7,
  rank: 7,
  title: 'Artificial Intelligence Ethics',
  explanation: 'Major AI companies signed a new ethical framework following controversial applications.'
}, {
  id: 8,
  rank: 8,
  title: 'Electric Vehicle Market',
  explanation: 'New models announced and infrastructure developments driving increased adoption.'
}, {
  id: 9,
  rank: 9,
  title: 'Education Technology',
  explanation: 'Post-pandemic shifts in educational tools and methodologies gaining widespread attention.'
}, {
  id: 10,
  rank: 10,
  title: 'Remote Work Policies',
  explanation: 'Major corporations announcing permanent policy changes affecting millions of workers.'
}];
export const mockArticles: Article[] = [
// Climate Change Summit - Cluster 1
{
  id: 1,
  title: 'World Leaders Pledge $100 Billion for Climate Action at COP28',
  summary: 'Major economies announced significant financial commitments to combat climate change at the ongoing COP28 summit in Dubai.',
  content: 'Full article content here...',
  source: 'Global News',
  sourceIcon: 'https://placehold.co/100x100?text=GN',
  url: 'https://example.com/climate-summit',
  thumbnail: 'https://images.unsplash.com/photo-1618044733300-9472054094ee?q=80&w=2000&auto=format&fit=crop',
  publishedAt: '2 hours ago',
  topicId: 1,
  clusterId: 'climate-1',
  clusterTitle: 'COP28 Climate Summit Developments'
}, {
  id: 2,
  title: 'China and US Announce Joint Emission Reduction Targets',
  summary: "The world's two largest economies have agreed to accelerate emission cuts in a surprise announcement.",
  content: 'Full article content here...',
  source: 'Eastern Herald',
  sourceIcon: 'https://placehold.co/100x100?text=EH',
  url: 'https://example.com/china-us-climate',
  thumbnail: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?q=80&w=2000&auto=format&fit=crop',
  publishedAt: '3 hours ago',
  topicId: 1,
  clusterId: 'climate-1',
  clusterTitle: 'COP28 Climate Summit Developments'
}, {
  id: 3,
  title: 'Small Island Nations Demand More Urgent Action at COP28',
  summary: 'Representatives from vulnerable island states say current pledges are insufficient to prevent catastrophic sea level rise.',
  content: 'Full article content here...',
  source: 'Pacific Daily',
  sourceIcon: 'https://placehold.co/100x100?text=PD',
  url: 'https://example.com/island-nations-climate',
  thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop',
  publishedAt: '5 hours ago',
  topicId: 1,
  clusterId: 'climate-1',
  clusterTitle: 'COP28 Climate Summit Developments'
},
// Tech Layoffs - Cluster 1
{
  id: 4,
  title: 'Major Tech Company Announces 10,000 Job Cuts Amid Restructuring',
  summary: 'The Silicon Valley giant is reducing its workforce by 8% as part of a strategic pivot toward AI development.',
  content: 'Full article content here...',
  source: 'Tech Insider',
  sourceIcon: 'https://placehold.co/100x100?text=TI',
  url: 'https://example.com/tech-layoffs',
  thumbnail: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2000&auto=format&fit=crop',
  publishedAt: '1 hour ago',
  topicId: 2,
  clusterId: 'tech-1',
  clusterTitle: 'Tech Industry Workforce Reductions'
}, {
  id: 5,
  title: "Industry Analysis: What's Behind the Wave of Tech Layoffs?",
  summary: 'Experts examine the economic factors and strategic shifts driving the recent surge in technology sector job cuts.',
  content: 'Full article content here...',
  source: 'Business Review',
  sourceIcon: 'https://placehold.co/100x100?text=BR',
  url: 'https://example.com/tech-layoff-analysis',
  thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop',
  publishedAt: '4 hours ago',
  topicId: 2,
  clusterId: 'tech-1',
  clusterTitle: 'Tech Industry Workforce Reductions'
},
// Cryptocurrency Regulation - Cluster 1
{
  id: 6,
  title: 'EU Approves Comprehensive Cryptocurrency Regulation Framework',
  summary: 'New rules establish licensing requirements, consumer protections, and environmental standards for crypto operations in Europe.',
  content: 'Full article content here...',
  source: 'Euro Finance',
  sourceIcon: 'https://placehold.co/100x100?text=EF',
  url: 'https://example.com/eu-crypto-regulation',
  thumbnail: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=2000&auto=format&fit=crop',
  publishedAt: '6 hours ago',
  topicId: 3,
  clusterId: 'crypto-1',
  clusterTitle: 'Global Cryptocurrency Regulatory Developments'
}, {
  id: 7,
  title: 'Asian Markets React to New Cryptocurrency Trading Rules',
  summary: 'Cryptocurrency prices fluctuate as Singapore and Japan implement new regulatory requirements for digital asset exchanges.',
  content: 'Full article content here...',
  source: 'Asia Markets',
  sourceIcon: 'https://placehold.co/100x100?text=AM',
  url: 'https://example.com/asia-crypto-rules',
  thumbnail: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?q=80&w=2000&auto=format&fit=crop',
  publishedAt: '8 hours ago',
  topicId: 3,
  clusterId: 'crypto-1',
  clusterTitle: 'Global Cryptocurrency Regulatory Developments'
}, {
  id: 8,
  title: 'US Treasury Proposes New Tax Reporting Requirements for Crypto Transactions',
  summary: 'The proposal aims to reduce tax evasion through cryptocurrency transactions by enhancing reporting obligations.',
  content: 'Full article content here...',
  source: 'Financial Times',
  sourceIcon: 'https://placehold.co/100x100?text=FT',
  url: 'https://example.com/us-crypto-tax',
  thumbnail: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?q=80&w=2000&auto=format&fit=crop',
  publishedAt: '12 hours ago',
  topicId: 3,
  clusterId: 'crypto-1',
  clusterTitle: 'Global Cryptocurrency Regulatory Developments'
}];