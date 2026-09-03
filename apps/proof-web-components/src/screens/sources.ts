export const SCREEN_SOURCES: Record<string, string> = {
  about: `<AboutScreen>
  <section class="da-panel da-panel--about">
    {/* Intro, runtime npm packages, Component source panel, docs */}
  </section>
</AboutScreen>`,
  overview: `<OverviewScreen locale={locale} userRole={userRole}>
  <GridLayout columns={3} gap={12} title="Destination KPIs">
    {MOCK_DESTINATIONS.map((dest) => (
      <KpiCard title={…} value={…} delta={…} />
    ))}
  </GridLayout>
  <LineChart points={aggregateVisitorTrend()} xAxisLabel="Year" yAxisLabel="Total visitors" />
  <BarChart bars={destinationBarSeries(locale)} yAxisLabel="Visitors" />
  <RoleGate currentRole={userRole} allowedRoles={['admin']} label="Operations metrics">
    <MetricChip chipLabel="Avg. stay" chipValue="4.2 nights" />
    <StatusBadge statusText="Data freshness: current" tone="success" />
  </RoleGate>
</OverviewScreen>`,
  destinations: `<DestinationsScreen …>
  <FilterGrid>…</FilterGrid>
  <DataTable rows={rows} />
  <DetailPanel>…</DetailPanel>
</DestinationsScreen>`,
  maps: `<MapsScreen mapsPanel={mapsPanel}>
  <rd-geo-map | rd-three-geo-globe />
  <GeoExplorer list selected-id lockstep />
</MapsScreen>`,
  media: `<MediaScreen selectedId={selectedId}>
  <SelectInput label="Flat video (YouTube)" />
  <rd-youtube-embed video-id={…} />
</MediaScreen>`,
  authoring: `<AuthoringScreen selectedId={selectedId}>
  <SelectInput label="360° destination" />
  <input type="file" accept="video/*" />
  <rd-flat-video-viewport />
  <rd-equirect-sphere-viewport flip-interior />
  <rd-wasm-media operation="equirect-extract" />
</AuthoringScreen>`,
  intel: `<IntelScreen userRole={userRole} newsQuery={newsQuery}>
  <NewsSearchBox />
  <NewsResultsTable rows={filteredArticles} />
</IntelScreen>`,
  plan: `<PlanScreen userRole={userRole}>
  <RoleGate currentRole={userRole} allowedRoles={['editor', 'admin']} label="Trip editor">
    … trip planner form …
  </RoleGate>
</PlanScreen>`,
  views: `<ViewsScreen locale={locale} selectedId={selectedId}>
  <JourneySankeyChart /> <VennOverlapChart />
  <rd-three-scatter /> <rd-media-carousel />
</ViewsScreen>`,
  stack: `<StackScreen userRole={userRole}>
  <RoleGate currentRole={userRole} allowedRoles={['admin']} label="Infrastructure stack">
    EnvConfig + infra nodes
  </RoleGate>
</StackScreen>`,
  settings: `<SettingsScreen>
  <header><h2>Settings</h2><ThemeToggle /></header>
  <AtlasContextControls>
    <AppLanguageSelect locales={DEFAULT_APP_LOCALES} value={locale} />
  </AtlasContextControls>
  <Collapsible title="Integration keys (BYOK)">…</Collapsible>
</SettingsScreen>`,
};
