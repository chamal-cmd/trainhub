# ─────────────────────────────────────────────────────────────────────────────
# TrainHub  -  Full Module Import Script
# Creates 8 training modules with topics and step content in Supabase
# Run once. Safe to re-run  -  checks for existing titles first.
# ─────────────────────────────────────────────────────────────────────────────

$BASE     = "https://yqefhohpfdcfripuswpw.supabase.co"
$SVC_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxZWZob2hwZmRjZnJpcHVzd3B3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQyMDUzMSwiZXhwIjoyMDk0OTk2NTMxfQ.eahjefv_ciK5jELC0x4iNrQhd6SqJngCStLVAXjSJGQ"
$ADMIN_ID = "ba75f37f-e8ce-4c70-b9b6-8e2c09c4c81f"

$H = @{
    "apikey"        = $SVC_KEY
    "Authorization" = "Bearer $SVC_KEY"
    "Content-Type"  = "application/json"
    "Prefer"        = "return=representation"
}

# ── Helpers ───────────────────────────────────────────────────────────────────

function sb($table, $body, $method = "POST") {
    $json = $body | ConvertTo-Json -Depth 30 -Compress
    return Invoke-RestMethod -Uri "$BASE/rest/v1/$table" -Method $method -Headers $H -Body $json
}

function sbGet($table, $query) {
    return Invoke-RestMethod -Uri "$BASE/rest/v1/${table}?${query}" -Headers $H
}

# Build a TipTap doc node
function doc {
    param([array]$nodes)
    return @{ type = "doc"; content = $nodes }
}

function para([string]$text, [array]$marks = @()) {
    $textNode = @{ type = "text"; text = $text }
    if ($marks.Count -gt 0) { $textNode.marks = $marks }
    return @{ type = "paragraph"; content = @($textNode) }
}

function h2([string]$text) {
    return @{ type = "heading"; attrs = @{ level = 2 }; content = @(@{ type = "text"; text = $text }) }
}

function h3([string]$text) {
    return @{ type = "heading"; attrs = @{ level = 3 }; content = @(@{ type = "text"; text = $text }) }
}

function ul([string[]]$items) {
    $listItems = $items | ForEach-Object {
        @{ type = "listItem"; content = @(@{ type = "paragraph"; content = @(@{ type = "text"; text = $_ }) }) }
    }
    return @{ type = "bulletList"; content = $listItems }
}

function ol([string[]]$items) {
    $listItems = $items | ForEach-Object {
        @{ type = "orderedList"; content = @(@{ type = "paragraph"; content = @(@{ type = "text"; text = $_ }) }) }
    }
    return @{ type = "orderedList"; content = $listItems }
}

function note([string]$text) {
    return @{
        type    = "blockquote"
        content = @(@{ type = "paragraph"; content = @(@{ type = "text"; text = $text; marks = @(@{ type = "italic" }) }) })
    }
}

# ── Module Definitions ────────────────────────────────────────────────────────

$MODULES = @(

  # ── 1. GP Bookkeeper Onboarding ──────────────────────────────────────────
  @{
    title       = "GP Bookkeeper Onboarding"
    description = "Everything you need to know to hit the ground running at GP Bookkeeper. Start here on day one."
    emoji       = "🚀"
    cover_color = "#7C3AED"
    topics      = @(
      @{
        title = "Welcome to GP Bookkeeper"
        steps = @(
          @{
            title   = "Welcome to the Team"
            content = doc @(
              h2 "Welcome!"
              para "We're so glad you're here. GP Bookkeeper provides bookkeeping and accounting services to small-to-medium businesses across Australia. We specialise in Xero-based cloud accounting and work closely with business owners to keep their finances accurate and up to date."
              para "This onboarding module will walk you through everything you need for your first week. Work through each topic in order  -  each one unlocks the next after you pass a short quiz."
              ul @(
                "We are a remote-friendly, cloud-first team"
                "Accuracy and client communication are our #1 priorities"
                "If you're unsure about anything, ask  -  there are no silly questions"
              )
              note "Tip: Complete all onboarding modules before working on any live client files."
            )
          }
          @{
            title   = "Our Values and Culture"
            content = doc @(
              h2 "What We Stand For"
              para "Everything we do at GP Bookkeeper is guided by these five principles:"
              ul @(
                "Accuracy first  -  double-check your work before submitting or publishing anything"
                "Client-first mindset  -  respond to clients promptly and professionally, always"
                "Continuous learning  -  software and tax rules change constantly; stay current"
                "Ownership  -  take responsibility for your tasks from start to finish"
                "Teamwork  -  if you're stuck, ask. We'd rather help than have an error go unnoticed"
              )
              para "We measure success not just by hours worked, but by the quality and accuracy of the work delivered."
            )
          }
        )
      }
      @{
        title = "Your Tools and Systems"
        steps = @(
          @{
            title   = "Software We Use Daily"
            content = doc @(
              h2 "The GP Bookkeeper Tech Stack"
              para "You'll need logins for all of the following. Your invitations will arrive by email before your start date."
              ul @(
                "Xero  -  primary accounting platform for all client bookkeeping"
                "Dext  -  document capture and OCR for receipts, invoices and bills"
                "Microsoft 365  -  email, Teams (chat), SharePoint (file storage)"
                "TrainHub  -  our internal training platform (you're here right now!)"
                "LastPass  -  password manager (never share credentials in plain text)"
              )
              note "Check your inbox for invitation emails from each platform. Accept them all before your first day."
            )
          }
          @{
            title   = "Access Setup Checklist"
            content = doc @(
              h2 "Tick These Off Before You Start"
              para "Before working on any client file, confirm you have access to everything below:"
              ul @(
                "GP Bookkeeper email (yourname@gpbookkeeper.com.au)  -  send a test email to chamal@gpbookkeeper.com.au"
                "Microsoft Teams  -  download the app and join the GP Bookkeeper team"
                "Xero Practice Manager  -  check for your invitation email"
                "Dext Partner Dashboard  -  check for your invitation email"
                "SharePoint / OneDrive  -  confirm you can open the Clients folder"
                "TrainHub  -  you already have this! Complete all modules before working live"
              )
              para "Once all access is confirmed, book a 30-minute onboarding call with Chamal."
            )
          }
        )
      }
      @{
        title = "Communication Standards"
        steps = @(
          @{
            title   = "Client Email Guidelines"
            content = doc @(
              h2 "How We Communicate with Clients"
              para "Professional communication is one of the most visible parts of our service. Every email reflects on GP Bookkeeper."
              ul @(
                "Always respond to client emails within 1 business day  -  even just to acknowledge receipt"
                "Use a professional but friendly tone  -  no slang, no emoji in formal correspondence"
                "Always use your @gpbookkeeper.com.au email address for all client communication"
                "Use a clear, descriptive subject line every time"
                "Always include your email signature (template provided by Chamal)"
                "CC Chamal on any sensitive, complex or unusual client communications"
              )
              note "When unsure how to handle a client query, ask Chamal before replying."
            )
          }
          @{
            title   = "Internal Communication"
            content = doc @(
              h2 "Communicating with the Team"
              para "We use Microsoft Teams for day-to-day internal communication."
              ul @(
                "Teams is for quick questions, updates and daily check-ins"
                "Mark yourself as Away when you're unavailable or in a meeting"
                "For anything needing a paper trail, use email instead of Teams"
                "Weekly team meetings are in your calendar  -  attendance is expected"
                "If something is urgent and you haven't heard back in 2 hours, follow up in Teams"
                "Response time expectation: within 1 hour during business hours"
              )
            )
          }
        )
      }
      @{
        title = "Your First Week"
        steps = @(
          @{
            title   = "Day 1 Tasks"
            content = doc @(
              h2 "What to Do on Day One"
              para "Work through this list in order. Tick each off as you go:"
              ul @(
                "Log in to your GP Bookkeeper email and send a test email to Chamal"
                "Set up your email signature (template from Chamal)"
                "Download Microsoft Teams and join the GP Bookkeeper workspace"
                "Accept your Xero Practice Manager invitation"
                "Accept your Dext invitation"
                "Log into TrainHub and plan your module order"
                "Book your 30-min onboarding call with Chamal via calendar"
              )
              note "Don't touch any live client files until Chamal has cleared you to do so."
            )
          }
          @{
            title   = "End of Week 1 Goals"
            content = doc @(
              h2 "What to Have Done by Friday"
              para "By the end of your first week, aim to have completed all of the following:"
              ul @(
                "All TrainHub onboarding modules completed (including quizzes)"
                "Familiarised yourself with 2 client files in Xero  -  Chamal will point you to these"
                "Completed the File Management module and understood our folder structure"
                "Asked every question you have  -  no question is too basic in week one"
                "Completed your first bank reconciliation under supervision"
              )
              para "Accuracy over speed  -  always. Take your time and ask when unsure."
            )
          }
        )
      }
    )
  }

  # ── 2. Xero Foundations ───────────────────────────────────────────────────
  @{
    title       = "Xero Foundations"
    description = "Master the core Xero features you'll use every single day as a bookkeeper at GP Bookkeeper."
    emoji       = "📊"
    cover_color = "#1B64F2"
    topics      = @(
      @{
        title = "Getting Started in Xero"
        steps = @(
          @{
            title   = "Navigating the Xero Dashboard"
            content = doc @(
              h2 "Your First Look at Xero"
              para "When you open a Xero organisation, you land on the Dashboard. Here's what each section does:"
              ul @(
                "Bank Accounts  -  live balance + items awaiting reconciliation"
                "Invoices owed to you  -  outstanding receivables at a glance"
                "Bills you need to pay  -  outstanding payables"
                "Account Watchlist  -  track any specific account balances you care about"
                "Total Cash In/Out  -  visual cash flow graph for the current month"
              )
              note "Tip: Press ? anywhere in Xero to see all keyboard shortcuts."
            )
          }
          @{
            title   = "The Business Menu"
            content = doc @(
              h2 "Where You'll Spend Most of Your Time"
              para "The Business menu contains all the core transaction tools:"
              ul @(
                "Invoices  -  create and manage customer invoices (accounts receivable)"
                "Bills to Pay  -  enter and manage supplier bills (accounts payable)"
                "Bank Accounts  -  access reconciliation from here"
                "Products & Services  -  manage item codes and prices"
                "Expense Claims  -  process employee expense reimbursements"
              )
              para "You'll also use Accounting > Reports frequently for the GST Return, P&L and Balance Sheet."
            )
          }
        )
      }
      @{
        title = "Chart of Accounts"
        steps = @(
          @{
            title   = "Understanding the Chart of Accounts"
            content = doc @(
              h2 "The Backbone of Bookkeeping"
              para "The Chart of Accounts (COA) is a categorised list of every account used to record financial transactions. Every transaction must be coded to an account."
              ul @(
                "Assets  -  what the business owns: bank, equipment, debtors (money owed to them)"
                "Liabilities  -  what the business owes: loans, credit cards, creditors"
                "Equity  -  the owner's stake in the business"
                "Revenue  -  income earned from sales and services"
                "Expenses  -  costs incurred to operate the business"
              )
              note "Always verify the correct account before coding. If unsure, ask  -  don't guess."
            )
          }
          @{
            title   = "Coding Transactions Correctly"
            content = doc @(
              h2 "The Golden Rules of Coding"
              para "Correct coding is the single most important skill in bookkeeping. A coding error ripples through reports, BAS and tax returns."
              ul @(
                "Match every transaction to its true economic nature  -  not just what it looks like"
                "Check client notes for specific suppliers or instructions before coding"
                "Always use the correct GST tax code  -  wrong codes break the BAS"
                "If unsure, leave it UNCODED and flag it rather than guessing"
                "Code the same type of transaction the same way, every time  -  consistency is key"
                "Wages and super are ALWAYS BAS Excluded  -  never code them with a GST code"
              )
            )
          }
        )
      }
      @{
        title = "Bank Reconciliation"
        steps = @(
          @{
            title   = "What is Bank Reconciliation?"
            content = doc @(
              h2 "The Daily Task of a Bookkeeper"
              para "Bank reconciliation is the process of matching every transaction in the client's Xero bank feed to its corresponding accounting entry. It ensures the books are complete and accurate."
              ul @(
                "Should be done daily or at minimum weekly"
                "Unreconciled items = incomplete books = unreliable reports"
                "Each transaction must be: matched to an invoice/bill, coded as a new expense/income, or identified as a transfer"
              )
              para "A fully reconciled bank account is your proof that the books reflect reality."
            )
          }
          @{
            title   = "Reconciling in Xero  -  Step by Step"
            content = doc @(
              h2 "How to Reconcile"
              para "Go to Accounting > Bank Accounts, then click Reconcile on the account you're working on."
              ul @(
                "1. Xero shows unmatched bank feed transactions on the left and suggested matches on the right"
                "2. If the suggested match is correct, click OK to confirm"
                "3. If no match exists, create a new transaction: Spend Money, Receive Money, or a bill/invoice match"
                "4. For transfers between accounts, always use Transfer  -  not Spend/Receive Money"
                "5. Once all items are matched, click Reconcile X items"
                "6. Check: reconciled balance should match your bank statement"
              )
              note "Never click 'Reconcile Anyway' without investigating the discrepancy first."
            )
          }
          @{
            title   = "Handling Tricky Transactions"
            content = doc @(
              h2 "Common Reconciliation Scenarios"
              para "You'll encounter these regularly:"
              ul @(
                "Bank fees  -  code to Bank Fees & Charges, BAS Excluded"
                "ATO payment (BAS)  -  code to GST Liability or Tax Payable, BAS Excluded"
                "Superannuation payment  -  code to Superannuation Expense, BAS Excluded"
                "Unknown deposit  -  flag for client to identify before coding"
                "Transfers between accounts  -  always use the Transfer option, not income/expense"
                "Loan repayments  -  split into principal (liability) and interest (expense)"
              )
            )
          }
        )
      }
      @{
        title = "Invoices & Bills"
        steps = @(
          @{
            title   = "Creating & Managing Invoices"
            content = doc @(
              h2 "Accounts Receivable in Xero"
              para "Invoices represent money owed TO the business. Here's how to work with them:"
              ul @(
                "Go to Business > Invoices > New Invoice"
                "Set the correct contact (customer), invoice date, due date and reference"
                "Add line items with the correct account code and GST tax code"
                "Approve the invoice  -  this moves it to the outstanding receivables list"
                "Send directly from Xero using the Send button (emails the PDF to the client)"
                "When payment arrives, it matches automatically during bank reconciliation"
              )
            )
          }
          @{
            title   = "Entering & Approving Bills"
            content = doc @(
              h2 "Accounts Payable in Xero"
              para "Bills represent money the business OWES to suppliers. Process them accurately to maintain correct payables records."
              ul @(
                "Go to Business > Bills to Pay > New Bill"
                "Enter supplier name, invoice date, due date and supplier reference"
                "Code each line to the correct account with the right GST code"
                "Approve the bill  -  it moves to the payables list"
                "When payment is made, match it during bank reconciliation"
              )
              note "For clients using Dext, most bills arrive pre-coded  -  just review, adjust if needed, and approve."
            )
          }
        )
      }
      @{
        title = "Key Reports"
        steps = @(
          @{
            title   = "Reports You'll Use Every Month"
            content = doc @(
              h2 "The Essential Xero Reports"
              para "Go to Accounting > Reports to access all reports. These are the ones you'll run regularly:"
              ul @(
                "Profit & Loss  -  income vs expenses for a period. Run at month end and share with client"
                "Balance Sheet  -  snapshot of assets, liabilities and equity at a specific date"
                "Aged Receivables  -  who owes the business money and for how long"
                "Aged Payables  -  who the business owes money to and for how long"
                "GST Return  -  the source of truth for BAS preparation"
                "Bank Reconciliation Summary  -  confirms all accounts are reconciled"
              )
            )
          }
          @{
            title   = "Running, Reviewing & Sending Reports"
            content = doc @(
              h2 "How to Use Reports Effectively"
              para "Before sending any report to a client, always review it for obvious errors first."
              ul @(
                "Check the date range is correct before running"
                "Scan the P&L for unusually large or small amounts compared to previous months"
                "Use Compare to show the same period last year alongside current"
                "Export to PDF for client distribution  -  use the Export button"
                "Save custom report settings using Save as Custom for repeated use"
                "For formal management reports, use Xero's Draft/Published feature"
              )
              note "If a number looks wrong, investigate before sending  -  never send a report you're not confident in."
            )
          }
        )
      }
    )
  }

  # ── 3. GST & BAS ─────────────────────────────────────────────────────────
  @{
    title       = "GST & BAS"
    description = "Prepare and lodge Business Activity Statements accurately for Australian clients. Covers GST coding, BAS preparation and ATO lodgement."
    emoji       = "🧾"
    cover_color = "#B45309"
    topics      = @(
      @{
        title = "Understanding GST"
        steps = @(
          @{
            title   = "What is GST?"
            content = doc @(
              h2 "Goods and Services Tax  -  The Basics"
              para "GST is a 10% tax applied to most goods, services and other items sold in Australia. Businesses registered for GST collect it on sales and can claim credits for GST paid on purchases."
              ul @(
                "Registration required when GST turnover exceeds $75,000 per year"
                "GST on Sales (collected from customers) is money owed to the ATO"
                "Input Tax Credits (GST on purchases) reduce what you owe"
                "The net difference is reported and paid via the BAS"
                "Most small businesses report quarterly; larger businesses report monthly"
              )
            )
          }
          @{
            title   = "GST Tax Codes in Xero"
            content = doc @(
              h2 "The Tax Codes You Must Know"
              para "Using the correct tax code on every transaction is critical  -  wrong codes produce an incorrect BAS."
              ul @(
                "GST (Tax on Sales)  -  10% GST collected on a taxable sale"
                "GST on Expenses  -  10% GST paid on a purchase you can claim as a credit"
                "BAS Excluded  -  no GST impact: wages, super, ATO payments, bank fees, loan repayments"
                "GST Free (Export)  -  zero-rated sales like basic food, some medical, exports"
                "Input Taxed  -  financial supplies like interest and residential rent: no GST, no credit claimable"
              )
              note "Wages and superannuation are ALWAYS BAS Excluded. This is the most common coding mistake."
            )
          }
        )
      }
      @{
        title = "Preparing a BAS"
        steps = @(
          @{
            title   = "What Is a BAS?"
            content = doc @(
              h2 "Business Activity Statement Overview"
              para "A BAS (Business Activity Statement) is how businesses report and pay their tax obligations to the ATO  -  primarily GST, PAYG withholding and PAYG instalments."
              ul @(
                "G1  -  Total sales for the period (including GST)"
                "G2  -  Export sales (GST free)"
                "G10  -  Capital purchases (assets)"
                "G11  -  Non-capital purchases (expenses)"
                "1A  -  GST collected on sales (you owe this to the ATO)"
                "1B  -  Input Tax Credits you're claiming (GST on purchases)"
                "W1/W2  -  PAYG withholding (payroll tax withheld from employee wages)"
              )
            )
          }
          @{
            title   = "BAS Preparation in Xero"
            content = doc @(
              h2 "Step-by-Step BAS Prep"
              para "Follow these steps every quarter:"
              ul @(
                "1. Ensure ALL transactions for the period are reconciled and correctly coded"
                "2. Go to Accounting > Reports > GST Return"
                "3. Set the correct date range (the BAS quarter)"
                "4. Review each GST code total  -  do they look reasonable vs last quarter?"
                "5. Spot-check: look for any wages coded with a GST code (they shouldn't have one)"
                "6. Check for missing transactions  -  compare to bank statement totals"
                "7. Once satisfied, use the GST Return figures to complete the ATO BAS form"
              )
              note "Never prepare a BAS on an unreconciled Xero file. Reconcile everything first."
            )
          }
          @{
            title   = "Common BAS Mistakes to Avoid"
            content = doc @(
              h2 "Errors That Will Cost the Client"
              para "These are the most common BAS errors we see  -  learn to spot them before they become lodgements:"
              ul @(
                "Wages coded with a GST tax code  -  always BAS Excluded"
                "Superannuation payments with GST  -  always BAS Excluded"
                "ATO payment/refund coded with GST  -  always BAS Excluded"
                "Bank interest income coded as GST  -  usually Input Taxed or BAS Excluded"
                "Claiming GST on private health insurance  -  not claimable"
                "Missing credit card transactions from the period"
                "Forgetting to reconcile before running the GST Return"
              )
            )
          }
        )
      }
      @{
        title = "Lodgement & Deadlines"
        steps = @(
          @{
            title   = "BAS Due Dates"
            content = doc @(
              h2 "Know Your Deadlines"
              para "Missing a BAS deadline results in ATO penalties and interest. These are the standard quarterly due dates:"
              ul @(
                "Q1 July - September: 28 October (or 25 November via registered BAS agent)"
                "Q2 October - December: 28 February"
                "Q3 January - March: 28 April (or 26 May via BAS agent)"
                "Q4 April - June: 28 July (or 25 August via BAS agent)"
                "Monthly lodgers: 21st of the following month"
              )
              note "As a registered BAS agent, GP Bookkeeper gets the extended deadline. Always confirm with Chamal which date applies to each client."
            )
          }
          @{
            title   = "How to Lodge"
            content = doc @(
              h2 "Lodgement Methods"
              para "There are several ways to lodge a completed BAS:"
              ul @(
                "Via ATO Online Services for Agents  -  Chamal will do this for most clients"
                "Via Xero Tax  -  lodges directly from Xero for practices with a Xero Tax subscription"
                "Via the client's ATO Business Portal  -  only if the client self-lodges"
                "Paper BAS  -  last resort only"
              )
              para "After lodgement, always note the lodgement receipt number in the client file and advise the client of the outcome and any amount payable."
            )
          }
        )
      }
    )
  }

  # ── 4. Payroll & STP ─────────────────────────────────────────────────────
  @{
    title       = "Payroll & Single Touch Payroll"
    description = "Set up employees, run pay runs and meet ATO Single Touch Payroll obligations in Xero."
    emoji       = "💼"
    cover_color = "#15803D"
    topics      = @(
      @{
        title = "Setting Up Employees"
        steps = @(
          @{
            title   = "Adding a New Employee in Xero"
            content = doc @(
              h2 "Employee Setup  -  What You Need"
              para "Go to Payroll > Employees > Add Employee. Collect the following from the employee before setting them up:"
              ul @(
                "Full legal name and date of birth"
                "Tax File Number (TFN)  -  via a completed TFN Declaration form"
                "Residential address"
                "Bank account BSB and account number for pay deposits"
                "Superannuation fund name, USI (unique superannuation identifier) and member number"
                "Employment type: full-time, part-time or casual"
                "Agreed pay rate and pay frequency (weekly, fortnightly, monthly)"
              )
              note "Do not process any pay run for a new employee until their TFN and super fund details are confirmed and entered."
            )
          }
          @{
            title   = "Pay Calendars & Leave Entitlements"
            content = doc @(
              h2 "Getting Payroll Configuration Right"
              para "Each employee must be assigned to a pay calendar and have their leave entitlements configured correctly."
              ul @(
                "Full-time employees: 4 weeks annual leave + 10 days personal/carer's leave per year"
                "Part-time employees: leave entitlements are pro-rata based on ordinary hours"
                "Casual employees: no annual or personal leave  -  higher hourly rate applies instead"
                "Long service leave: varies by state  -  check the relevant state legislation"
                "Assign employees to the correct pay calendar (weekly, fortnightly, monthly)"
              )
            )
          }
        )
      }
      @{
        title = "Running Payroll"
        steps = @(
          @{
            title   = "Running a Pay Run in Xero"
            content = doc @(
              h2 "Processing Payroll Step by Step"
              para "Go to Payroll > Pay Runs > New Pay Run, select the pay calendar and period, then follow these steps:"
              ul @(
                "1. Confirm the pay period dates are correct"
                "2. Review each employee's earnings  -  check hours, any leave taken, allowances"
                "3. Verify PAYG withholding looks correct for each employee"
                "4. Check super is calculating at the correct rate (11.5% from 1 July 2024)"
                "5. Click Post Pay Run  -  this creates the journal entries in Xero"
                "6. Process the bank payment to employees (batch payment or direct transfer)"
                "7. File STP  -  Xero will prompt you after posting"
              )
            )
          }
          @{
            title   = "Pay Run Review Checklist"
            content = doc @(
              h2 "Always Check Before You Post"
              para "Run through this checklist before posting every pay run:"
              ul @(
                "Are all hours/days worked correct for the period?"
                "Has approved leave been entered and verified?"
                "Are there any one-off payments  -  bonuses, commissions, allowances?"
                "Is PAYG withholding correct? Compare to ATO tax tables if uncertain"
                "Is super being calculated on ordinary time earnings (OTE) only?"
                "Does the net pay look consistent with the previous pay run?"
                "Are termination payments handled correctly (if any)?"
              )
              note "If anything looks unusual, pause and investigate before posting. It's much harder to fix after STP is filed."
            )
          }
        )
      }
      @{
        title = "Single Touch Payroll (STP)"
        steps = @(
          @{
            title   = "What is Single Touch Payroll?"
            content = doc @(
              h2 "The ATO's Real-Time Payroll Reporting System"
              para "Single Touch Payroll (STP) requires employers to report payroll information  -  wages, PAYG tax and super  -  to the ATO every time a pay run is processed."
              ul @(
                "Mandatory for ALL Australian employers, regardless of size"
                "Reporting happens automatically via Xero each time you file after a pay run"
                "Employees can see their year-to-date payroll data in myGov in real time"
                "STP Phase 2 requires more granular reporting (Xero handles this automatically)"
                "A year-end EOFY finalisation is required  -  replaces the old Payment Summary process"
              )
            )
          }
          @{
            title   = "Filing STP in Xero"
            content = doc @(
              h2 "Submitting STP After a Pay Run"
              para "After posting a pay run, Xero automatically prompts you to file an STP update:"
              ul @(
                "Review the filing summary  -  check employee count and totals look correct"
                "Click File  -  Xero sends the data directly to the ATO"
                "You'll receive a confirmation message  -  note the submission ID in your records"
                "If the filing shows an error, Xero will display the reason  -  investigate and refile"
                "Never leave a failed STP submission unfiled  -  the ATO tracks these"
              )
            )
          }
        )
      }
      @{
        title = "End of Financial Year Payroll"
        steps = @(
          @{
            title   = "EOFY Payroll Checklist"
            content = doc @(
              h2 "Closing Off the Financial Year"
              para "Complete these steps before 31 July each year:"
              ul @(
                "Confirm all pay runs for the financial year have been processed and filed"
                "Check all leave balances are correct in Xero"
                "Reconcile total gross wages to the wages expense account in the general ledger"
                "Reconcile total PAYG withheld to the sum of W1 on all BAS lodgements for the year"
                "Confirm all super contributions have been paid and reconciled"
                "Review any Reportable Employer Super Contributions (RESC) if applicable"
              )
            )
          }
          @{
            title   = "Submitting the EOFY STP Finalisation"
            content = doc @(
              h2 "The Year-End Finalisation"
              para "This step tells the ATO that your payroll is complete and allows employees to lodge their tax returns."
              ul @(
                "In Xero, go to Payroll > Single Touch Payroll > EOFY Finalisation"
                "Review each employee's year-to-date figures carefully"
                "Include any Reportable Fringe Benefits (RFBT) if applicable"
                "Handle closely held payees separately  -  different rules apply"
                "Submit the finalisation  -  Xero sends it to the ATO"
                "Deadline: 31 July following the end of the financial year"
              )
              note "Employees can only see their income statement in myGov after the finalisation is submitted. Don't delay this."
            )
          }
        )
      }
    )
  }

  # ── 5. Dext Prepare ──────────────────────────────────────────────────────
  @{
    title       = "Dext Prepare"
    description = "How to use Dext to capture, review and publish client documents directly into Xero. Our primary document processing tool."
    emoji       = "📄"
    cover_color = "#0F766E"
    topics      = @(
      @{
        title = "Introduction to Dext"
        steps = @(
          @{
            title   = "What is Dext and Why We Use It"
            content = doc @(
              h2 "Document Capture Without the Paper Chase"
              para "Dext (formerly Receipt Bank) is a document capture tool. Clients photograph their receipts or forward invoices to Dext, which uses OCR to extract the data automatically  -  no manual typing."
              ul @(
                "Clients submit receipts via the Dext mobile app, email, or web upload"
                "Dext reads the document and extracts: supplier, date, total, GST amount"
                "We review the extracted data in our bookkeeper dashboard, correct any errors, and publish directly to Xero"
                "Eliminates manual data entry and dramatically reduces coding errors"
                "The original document image is stored permanently in Dext as an audit trail"
              )
            )
          }
          @{
            title   = "The Dext Bookkeeper Dashboard"
            content = doc @(
              h2 "Navigating Your Dashboard"
              para "When you log in as a bookkeeper, you see all your client accounts listed. Here's the key navigation:"
              ul @(
                "Client list  -  click any client name to enter their Dext account"
                "Inbox  -  new documents submitted by the client, awaiting your review"
                "Archive  -  documents already reviewed and published to Xero"
                "Supplier Rules  -  automatic coding rules for recognised suppliers"
                "Settings  -  integrations, categories, user access"
              )
              note "Always work through the Inbox from oldest to newest  -  don't leave old items sitting unreviewed."
            )
          }
        )
      }
      @{
        title = "Uploading Documents"
        steps = @(
          @{
            title   = "Ways to Submit Documents"
            content = doc @(
              h2 "How Documents Get Into Dext"
              para "Documents can enter Dext in several ways. Your job is to ensure clients are using the most efficient method:"
              ul @(
                "Mobile App  -  client photographs receipt immediately after purchase (best practice  -  promotes same-day submission)"
                "Email forwarding  -  client forwards email invoices to their unique Dext email address"
                "Web upload  -  drag and drop files in the browser at app.dext.com"
                "Auto-Fetch  -  Dext can automatically fetch bank statements from some banks"
                "You can also upload documents on behalf of a client if needed"
              )
              note "Train clients to use the mobile app. The sooner they submit, the sooner we can reconcile."
            )
          }
          @{
            title   = "Document Types"
            content = doc @(
              h2 "How to Handle Different Document Types"
              para "Not all documents are treated the same in Dext:"
              ul @(
                "Purchase receipts and supplier invoices  -  processed as Bills or Expenses, published to Xero AP"
                "Sales invoices received from clients  -  same as above"
                "Bank statements  -  used for data matching only; not published as individual transactions"
                "Employee expense claims  -  reviewed by admin, then published as expense claims"
                "Credit notes  -  can be entered as negative amounts against the original supplier"
              )
            )
          }
        )
      }
      @{
        title = "Reviewing & Publishing"
        steps = @(
          @{
            title   = "Reviewing Extracted Data"
            content = doc @(
              h2 "Quality Control Before Publishing"
              para "Before publishing any document to Xero, always verify these fields:"
              ul @(
                "Supplier name  -  is it correct? If wrong, update it and a rule will remember next time"
                "Document date  -  must match the actual date on the receipt or invoice"
                "Total amount  -  verify it matches the document exactly, including cents"
                "GST amount  -  should be exactly 1/11th of the total for GST-inclusive items"
                "Category / account code  -  is it the right expense account in Xero?"
                "Document image quality  -  can you read it clearly? If blurry, ask client to resubmit"
              )
              note "Never publish a document you're not confident about. Flag it for Chamal's review first."
            )
          }
          @{
            title   = "Publishing to Xero"
            content = doc @(
              h2 "Sending Documents to Xero"
              para "Once you've reviewed and are happy with the data:"
              ul @(
                "Click Publish on a single document, or tick multiple items and use Bulk Publish"
                "The transaction appears in Xero's bank reconciliation as a bill or expense"
                "Match it to the corresponding bank payment during your next reconciliation session"
                "Published documents move to the Dext Archive  -  the original image is stored permanently"
              )
              para "If you need to edit a published document, you'll need to unpublish it first (or void in Xero and re-process)."
            )
          }
        )
      }
      @{
        title = "Troubleshooting Common Issues"
        steps = @(
          @{
            title   = "Fixing Incorrect Extractions"
            content = doc @(
              h2 "When Dext Gets It Wrong"
              para "Dext's OCR is good but not perfect. Here's how to fix the most common extraction errors:"
              ul @(
                "Wrong amount  -  click the amount field and type the correct value"
                "Wrong supplier  -  update the supplier name; create or update the supplier rule"
                "Missing GST  -  if GST was charged, manually enter the GST amount"
                "Wrong date  -  always cross-check the document image against the date field"
                "Blurry or unreadable image  -  mark as unreadable and ask client to resubmit"
              )
            )
          }
          @{
            title   = "Handling Duplicate Documents"
            content = doc @(
              h2 "Avoiding Double-Coding"
              para "Duplicates happen when clients submit the same document twice. Dext flags potential duplicates with a yellow warning  -  but doesn't always catch them."
              ul @(
                "Click the yellow warning icon to see the potential duplicate"
                "Compare supplier, date and total between both documents carefully"
                "If it IS a duplicate, delete the newer submission  -  do not publish both"
                "If you're not sure, ask the client to confirm before proceeding"
                "For clients who regularly duplicate, mention it in your next communication and ask them to check before submitting"
              )
            )
          }
        )
      }
    )
  }

  # ── 6. Dext Account Setup ─────────────────────────────────────────────────
  @{
    title       = "Dext Account Setup"
    description = "How to create and configure a new client account in Dext from scratch, connect it to Xero and onboard the client."
    emoji       = "⚙️"
    cover_color = "#0369A1"
    topics      = @(
      @{
        title = "Creating a New Client Account"
        steps = @(
          @{
            title   = "Setting Up a Client in Dext"
            content = doc @(
              h2 "Creating the Client Account"
              para "When onboarding a new client who will use Dext, create their account from the Dext Partner Dashboard."
              ul @(
                "Log in at app.dext.com using your GP Bookkeeper bookkeeper credentials"
                "Click Add Client and enter the client's business name and primary contact email"
                "Select the appropriate Dext plan  -  confirm with Chamal before choosing"
                "Set country to Australia and currency to AUD"
                "Click Create Client  -  the client receives an invitation email automatically"
              )
              note "Always confirm the plan and billing arrangement with Chamal before creating a new client account."
            )
          }
          @{
            title   = "Configuring Client Settings"
            content = doc @(
              h2 "Initial Configuration Checklist"
              para "After creating the account, configure these settings before the client starts using Dext:"
              ul @(
                "Default currency  -  confirm AUD is set"
                "GST/Tax settings  -  enable GST tracking"
                "Email submission address  -  copy the client's unique Dext email and send it to them"
                "Default document type  -  set to Supplier Invoice for most clients"
                "Supplier categories  -  ensure the key categories match your Xero chart of accounts"
              )
            )
          }
        )
      }
      @{
        title = "Connecting Dext to Xero"
        steps = @(
          @{
            title   = "Linking Dext to the Client's Xero"
            content = doc @(
              h2 "Setting Up the Xero Integration"
              para "Connecting Dext to Xero allows published documents to flow directly into Xero. Here's how:"
              ul @(
                "In Dext, open the client account and go to Settings > Integrations"
                "Click Connect next to Xero"
                "You'll be redirected to Xero  -  log in and select the correct organisation"
                "Click Allow Access  -  Dext syncs the chart of accounts and contact list from Xero"
                "Verify the connection by checking that Xero account codes appear in the Dext categories"
              )
            )
          }
          @{
            title   = "Mapping Accounts & Setting Up Rules"
            content = doc @(
              h2 "Making the Integration Work Accurately"
              para "After connecting to Xero, set up default mappings so documents code correctly from day one:"
              ul @(
                "Go to Settings > Categories and map each Dext category to the correct Xero account code"
                "Set the default GST tax code for each category"
                "Create Supplier Rules for the client's regular suppliers  -  saves review time every month"
                "Test the connection: publish one document and confirm it appears correctly in Xero"
                "Check that the GST amounts are flowing through correctly in Xero"
              )
              note "Spend 30 minutes on setup rules upfront and you'll save hours every month in review time."
            )
          }
        )
      }
      @{
        title = "Client Onboarding in Dext"
        steps = @(
          @{
            title   = "Inviting the Client as a User"
            content = doc @(
              h2 "Giving the Client Access"
              para "The client needs their own Dext login to submit documents."
              ul @(
                "In Dext, go to the client account > Settings > Users"
                "Click Invite User and enter the client's email address"
                "Set their permission level to Client  -  upload access only, no admin"
                "They'll receive an email with instructions to set their password"
                "Confirm they've downloaded the Dext mobile app on their phone (iOS and Android)"
              )
            )
          }
          @{
            title   = "Training the Client on Dext"
            content = doc @(
              h2 "What to Tell Your Client"
              para "When introducing a client to Dext, keep it simple. Cover these key points in a brief 10-minute walkthrough:"
              ul @(
                "Photograph every receipt immediately after purchase  -  don't let them pile up"
                "For emailed invoices, forward directly to their unique Dext email address (share this in writing)"
                "They don't need to categorise anything  -  we handle all the coding"
                "If a document is unclear or they submit it by mistake, they can delete and resubmit"
                "The sooner they submit, the sooner their books are up to date"
              )
              note "Send the client a one-page 'How to use Dext' summary after the walkthrough. Canva or a Word doc works well."
            )
          }
        )
      }
    )
  }

  # ── 7. Client Onboarding ─────────────────────────────────────────────────
  @{
    title       = "Client Onboarding"
    description = "The complete process for bringing on a new bookkeeping client  -  from first conversation to active monthly engagement."
    emoji       = "🤝"
    cover_color = "#7C3AED"
    topics      = @(
      @{
        title = "Pre-Engagement"
        steps = @(
          @{
            title   = "Initial Consultation Checklist"
            content = doc @(
              h2 "Questions to Answer Before Quoting"
              para "Before or during the first meeting with a prospective client, cover these questions:"
              ul @(
                "What does their business do, and how do they generate revenue?"
                "How many transactions do they have per month (approximately)?"
                "Are they currently on Xero? If not, what are they using?"
                "Do they have employees? If so, how many and how often are they paid?"
                "What are their pain points  -  what's not working right now?"
                "When do they need to be up and running?"
                "What does their current BAS situation look like  -  are they up to date?"
              )
              note "Use the answers to recommend the right service package. Run any new client quotes past Chamal before sending."
            )
          }
          @{
            title   = "Engagement Documentation"
            content = doc @(
              h2 "What Must Be Signed Before We Start"
              para "No work begins until the following are completed and on file:"
              ul @(
                "Signed Engagement Letter  -  outlines scope of services and fees"
                "Privacy Policy acknowledgement"
                "ATO Agent Nomination form  -  authorises GP Bookkeeper to act on their behalf"
                "Collected: ABN, entity type (sole trader, company, trust), full legal name, address"
                "Billing arrangement confirmed  -  direct debit, invoice or prepaid"
              )
              para "File all signed documents in SharePoint under Clients > [Client Name] > Correspondence."
            )
          }
        )
      }
      @{
        title = "Setting Up Their Xero"
        steps = @(
          @{
            title   = "Xero Organisation Setup"
            content = doc @(
              h2 "Getting Xero Ready for the Client"
              para "Depending on the client's situation, you'll either create a new Xero organisation or take over an existing one."
              ul @(
                "New to Xero: create a new organisation under the GP Bookkeeper partner account in Xero"
                "Existing Xero: request adviser access via Xero's Invite a User feature"
                "Confirm the correct Xero plan for their needs (Starter, Standard, Premium)"
                "Set up: financial year start date, GST registration and period, tax number (ABN)"
                "Connect bank feeds for all business bank accounts and credit cards"
              )
            )
          }
          @{
            title   = "Chart of Accounts & Opening Balances"
            content = doc @(
              h2 "Getting the Books Started Correctly"
              para "A correct setup from day one saves hours of correction later."
              ul @(
                "Start with Xero's default Australian chart of accounts"
                "Customise account names and codes to match the client's specific business"
                "Archive (don't delete) any accounts they won't use"
                "If migrating from another system: enter opening balances via a conversion balance journal"
                "Have Chamal review the opening balances before marking the file as active"
              )
              note "Opening balances are usually as at the start of the financial year or the start of the engagement period."
            )
          }
        )
      }
      @{
        title = "Ongoing Monthly Workflow"
        steps = @(
          @{
            title   = "The Monthly Bookkeeping Cycle"
            content = doc @(
              h2 "What Happens Every Month"
              para "Once a client is active, this is the standard monthly workflow:"
              ul @(
                "Weeks 1 - 2: Process all Dext items submitted by the client"
                "Weeks 2 - 3: Reconcile all bank accounts in Xero"
                "Week 3: Run P&L and Balance Sheet  -  review for unusual items"
                "Week 4: Send monthly report summary to client"
                "Month end: Process payroll if applicable; confirm super payments"
                "Quarterly: Prepare and lodge BAS"
              )
            )
          }
          @{
            title   = "Client Communication Rhythm"
            content = doc @(
              h2 "Keeping Clients in the Loop"
              para "Regular, proactive communication is what turns a client into a long-term client."
              ul @(
                "Send a monthly summary email with key P&L numbers and any flags for their attention"
                "Flag unidentified transactions before the month closes  -  never guess the coding"
                "Give advance warning if a large BAS payment is coming"
                "Remind clients to submit Dext documents by the 5th of each month"
                "Alert Chamal immediately if a client is unresponsive, unhappy or wants to discuss pricing"
              )
              note "Copy Chamal on any email involving pricing, complaints, tax risks or significant accounting decisions."
            )
          }
        )
      }
    )
  }

  # ── 8. Quick Tips  -  Trick Bytes ──────────────────────────────────────────
  @{
    title       = "Quick Tips  -  Trick Bytes"
    description = "Time-saving shortcuts, power-user tricks and month-end checklists for faster, smarter bookkeeping."
    emoji       = "⚡"
    cover_color = "#9333EA"
    topics      = @(
      @{
        title = "Xero Time-Savers"
        steps = @(
          @{
            title   = "Xero Keyboard Shortcuts"
            content = doc @(
              h2 "Work Faster in Xero"
              para "Press ? anywhere in Xero to see all shortcuts. Here are the most useful ones for daily bookkeeping:"
              ul @(
                "/  -  Opens the global search bar from anywhere  -  fastest way to find anything"
                "G then D  -  Jump to Dashboard"
                "G then B  -  Jump to Bank Reconciliation"
                "G then I  -  Jump to Invoices"
                "Tab  -  Move between fields quickly when entering data"
                "Enter  -  Confirm and save in most data entry screens"
                "Ctrl+S (or Cmd+S on Mac)  -  Save draft"
              )
            )
          }
          @{
            title   = "Batch Payments in Xero"
            content = doc @(
              h2 "Pay Multiple Suppliers at Once"
              para "Instead of paying bills one at a time, use Batch Payments to process multiple supplier payments in a single bank upload."
              ul @(
                "Go to Business > Bills to Pay"
                "Tick all bills you want to pay in this batch"
                "Click Batch Payment at the top of the list"
                "Select the payment bank account and date"
                "Export the batch payment file (.aba format for most Australian banks)"
                "Upload the file to your online banking to process the payment"
                "Once payment clears, Xero automatically matches it during reconciliation"
              )
              note "Batch payments only work if all the supplier bank details are entered in Xero. Check this before creating the batch."
            )
          }
          @{
            title   = "Bank Rules in Xero"
            content = doc @(
              h2 "Set and Forget Recurring Transactions"
              para "Bank Rules tell Xero how to automatically code recurring transactions  -  set them up once and they apply every time."
              ul @(
                "In Accounting > Bank Accounts, click Manage Account > Create Bank Rule"
                "Define the conditions: when description contains [text] or amount equals [value]"
                "Set the action: code to [account] with [tax code]  -  optionally auto-approve"
                "Rules apply during bank reconciliation  -  transactions are pre-coded and ready to confirm"
                "Review rules quarterly to ensure they're still accurate"
              )
              para "Bank rules are especially powerful for: subscriptions, recurring bank fees, insurance premiums and regular supplier payments."
            )
          }
        )
      }
      @{
        title = "Dext Power Tips"
        steps = @(
          @{
            title   = "Supplier Rules in Dext"
            content = doc @(
              h2 "Auto-Code Regular Suppliers"
              para "Dext Supplier Rules work like Bank Rules in Xero  -  documents from recognised suppliers are coded automatically."
              ul @(
                "In Dext, go to Settings > Supplier Rules"
                "Click Add Rule and select the supplier"
                "Set the default account code, GST tax code and category"
                "Next time Dext sees a document from that supplier, it auto-codes it"
                "You still review before publishing  -  but the coding is done for you"
              )
              para "Great candidates for supplier rules: fuel stations, phone providers, regular office suppliers, software subscriptions."
            )
          }
          @{
            title   = "Dext Mobile App Tips for Clients"
            content = doc @(
              h2 "Getting the Best Results from the App"
              para "The quality of what goes into Dext determines how much review work we have. Train clients on these techniques:"
              ul @(
                "Photograph in good lighting  -  avoid shadows and glare on the receipt"
                "Lay the receipt flat on a desk  -  don't hold it crumpled in your hand"
                "Make sure all four corners are visible in the frame"
                "For long receipts, photograph in sections if needed"
                "Submit immediately  -  same-day submissions get the most accurate results"
                "Check the app confirms 'Processing' before closing it"
              )
            )
          }
        )
      }
      @{
        title = "Month-End Mastery"
        steps = @(
          @{
            title   = "The Complete Month-End Checklist"
            content = doc @(
              h2 "Never Miss a Month-End Step"
              para "Run through this checklist for every client before closing off a month. Don't mark a month closed until every item is done."
              ul @(
                "All Dext items processed and published to Xero  -  Inbox is empty"
                "All bank accounts fully reconciled  -  zero outstanding items"
                "All payroll processed and STP filed (if applicable)"
                "Superannuation payments made and matched in reconciliation"
                "Aged Receivables reviewed  -  overdue invoices flagged to client"
                "Aged Payables reviewed  -  overdue bills flagged"
                "P&L and Balance Sheet reviewed  -  any unusual items investigated"
                "Monthly report email sent to client"
                "BAS prepared and lodged if quarter-end (with receipt number saved)"
              )
              note "Rushing a month-end is how errors get missed. Take the time to do it properly."
            )
          }
        )
      }
    )
  }

)

# ─────────────────────────────────────────────────────────────────────────────
# INSERT ALL MODULES
# ─────────────────────────────────────────────────────────────────────────────

$existingSubjects = Invoke-RestMethod -Uri "$BASE/rest/v1/subjects?select=title" -Headers $H
$existingTitles   = $existingSubjects | ForEach-Object { $_.title }

$totalSubjects = 0; $totalTopics = 0; $totalSteps = 0

foreach ($mod in $MODULES) {

  # Skip if already exists
  if ($existingTitles -contains $mod.title) {
    Write-Host "  SKIP (already exists): $($mod.title)" -ForegroundColor Yellow
    continue
  }

  # Insert subject
  $subjectBody = @{
    title       = $mod.title
    description = $mod.description
    emoji       = $mod.emoji
    cover_color = $mod.cover_color
    created_by  = $ADMIN_ID
  }
  $subjectJson   = $subjectBody | ConvertTo-Json -Depth 5 -Compress
  $subjectResult = Invoke-RestMethod -Uri "$BASE/rest/v1/subjects" -Method POST -Headers $H -Body $subjectJson
  $subjectId = if ($subjectResult -is [array]) { $subjectResult[0].id } else { $subjectResult.id }
  Write-Host "SUBJECT: $($mod.title)" -ForegroundColor Cyan
  $totalSubjects++

  $topicOrder = 0
  foreach ($topic in $mod.topics) {

    $topicBody = @{
      subject_id  = $subjectId
      title       = $topic.title
      order_index = $topicOrder
    }
    $topicJson   = $topicBody | ConvertTo-Json -Depth 5 -Compress
    $topicResult = Invoke-RestMethod -Uri "$BASE/rest/v1/topics" -Method POST -Headers $H -Body $topicJson
    $topicId = if ($topicResult -is [array]) { $topicResult[0].id } else { $topicResult.id }
    Write-Host "  TOPIC: $($topic.title)" -ForegroundColor Green
    $totalTopics++

    $stepOrder = 0
    foreach ($step in $topic.steps) {

      $stepBody = @{
        topic_id    = $topicId
        title       = $step.title
        content     = $step.content
        order_index = $stepOrder
      }
      $stepJson   = $stepBody | ConvertTo-Json -Depth 30 -Compress
      $stepResult = Invoke-RestMethod -Uri "$BASE/rest/v1/steps" -Method POST -Headers $H -Body $stepJson
      Write-Host "    STEP: $($step.title)" -ForegroundColor Gray
      $totalSteps++
      $stepOrder++
    }
    $topicOrder++
  }
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host " Import complete!" -ForegroundColor Green
Write-Host "  Subjects : $totalSubjects" -ForegroundColor White
Write-Host "  Topics   : $totalTopics"   -ForegroundColor White
Write-Host "  Steps    : $totalSteps"    -ForegroundColor White
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
