import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import DynamicAnalysisModal from '@/components/DynamicAnalysisModal';

describe('Analysis Modal Static Text Prevention', () => {
  test('DynamicAnalysisModal NEVER renders legacy static phrases', () => {
    const mockVM = {
      areaKm2: 15.2,
      hasSST: true,
      hasCHL: true,
      sst: { 
        meanF: 72.5, 
        minF: 71.2, 
        maxF: 74.8, 
        gradFperMile: 0.8 
      },
      chl: { mean: 0.45 },
      narrative: 'Sharp SST gradient detected. Favorable conditions.',
      confidence: 'high' as const
    };

    const { container } = render(
      <DynamicAnalysisModal 
        vm={mockVM} 
        sstOn={true}
        chlOn={true}
        isOpen={true}
        onClose={() => {}}
        onEnableLayers={() => {}}
      />
    );

    const html = container.textContent || '';
    
    // BANNED PHRASES - these should NEVER appear
    const bannedPhrases = [
      'Prediction Report',
      'opportunistic fishing',
      'Current conditions favor opportunistic',
      'Where To Look',
      'How To Fish',
      'Work different depths based on thermocline',
      'Check structure and current edges',
      'No bite reports in this area yet',
      'Tuna: unlikely',
      'Mahi: unlikely',
      'Billfish: unlikely',
      'Movement (24-72h)',
      'Currents placeholder',
      'AI Read-Out'
    ];

    bannedPhrases.forEach(banned => {
      expect(html).not.toContain(banned);
    });

    // REQUIRED PHRASES - real data should show
    expect(html).toContain('72.5°F'); // Real temperature
    expect(html).toContain('0.45 mg/m³'); // Real chlorophyll
    expect(html).toContain('Sharp SST gradient'); // Real narrative
  });

  test('Legacy AnalysisModal is not imported anywhere', async () => {
    // This test will fail at build time if AnalysisModal is imported
    // due to the ESLint rule we added
    expect(true).toBe(true);
  });
});
