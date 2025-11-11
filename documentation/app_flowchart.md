flowchart TD
  Start[Start] --> UserRoles{User Role Admin or Standard}
  UserRoles --> Login[User Login or Signup]
  Login --> Dashboard[Dashboard]
  Dashboard --> AccountsPage[Accounts Page]
  Dashboard --> CampaignWizard[Campaign Creation Wizard]
  AccountsPage --> CampaignWizard
  CampaignWizard --> CampaignDetails[Enter Keywords Topics Config]
  CampaignDetails --> ContentGeneration[Trigger AI Content Generation]
  ContentGeneration --> n8nMedia[Invoke n8n Media Workflows]
  n8nMedia --> StoreMedia[Store Media URLs in Supabase]
  StoreMedia --> Posting[Multi Account Auto Posting]
  Posting --> Monitoring[Monitor Comments Replies]
  Monitoring --> AutoInteraction[Auto DMs Replies via Keywords]
  AutoInteraction --> LeadCapture[Lead Capture via Typeform ConvertKit]
  LeadCapture --> StoreLeads[Store Leads in Supabase]
  Posting --> Analytics[Collect Impressions Clicks Conversions]
  Analytics --> Dashboard
  Dashboard --> Payment[Handle Payments via Whop]
  Payment --> RevenueDashboard[Show Revenue on Dashboard]
  RevenueDashboard --> End[End]