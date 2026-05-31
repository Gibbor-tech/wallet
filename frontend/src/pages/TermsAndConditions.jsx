import { useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, FileTextIcon, AlertTriangleIcon } from 'lucide-react'

function TermsAndConditions() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100/30 py-6 px-4 overflow-x-hidden">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-700 transition"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3">
            <div className="flex items-center gap-2 text-white">
              <FileTextIcon className="h-5 w-5" />
              <h1 className="text-lg font-bold">BankPay Terms & Conditions</h1>
            </div>
          </div>

          <div className="p-5 space-y-5">
            <section>
              <h2 className="text-base font-semibold text-gray-800 mb-1">1. Deposits</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Users can deposit <strong>any amount</strong> they wish. No upper limit. 
                Deposits are instant and free.
              </p>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-800 mb-1">2. Transfers</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Sending money between BankPay users is <strong>completely free</strong>. 
                No fees regardless of amount.
              </p>
            </section>

            <section className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <div className="flex items-start gap-2">
                <AlertTriangleIcon className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h2 className="text-base font-semibold text-amber-800">3. Withdrawal Fee</h2>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    A <strong>5% fee</strong> applies to every withdrawal. 
                    Example: Withdraw 10,000 RWF → fee 500 RWF, you receive 9,500 RWF.
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    This fee helps maintain service and secure transactions.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-base font-semibold text-gray-800 mb-1">4. General Terms</h2>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>You must own the registered phone number.</li>
                <li>BankPay may suspend fraudulent accounts.</li>
                <li>All transactions are final unless system error.</li>
                <li>Terms may be updated; continued use implies acceptance.</li>
              </ul>
            </section>

            <section className="text-xs text-gray-400 border-t pt-3 mt-2">
              <p>Last updated: May 2026</p>
              <p>support@bankpay.com</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsAndConditions