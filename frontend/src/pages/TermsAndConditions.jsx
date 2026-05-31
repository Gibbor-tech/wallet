import React from 'react';
import { Link } from 'react-router-dom';

function TermsAndConditions() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Terms and Conditions</h1>
            <p className="text-gray-600 mt-2">Please read these terms carefully</p>
          </div>

          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-600">
                By registering and using WalletPay, you agree to be bound by these Terms and Conditions.
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. User Accounts</h2>
              <p className="text-gray-600">
                You must provide accurate and complete information when creating an account.
                You are responsible for maintaining the confidentiality of your account credentials.
                You are responsible for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Deposits and Withdrawals</h2>
              <p className="text-gray-600">
                Deposits are made via MTN Mobile Money using USSD codes provided by administrators.
                Withdrawals are processed manually by administrators after verification.
                Minimum deposit and withdrawal amounts apply as displayed on the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Transaction Processing</h2>
              <p className="text-gray-600">
                All transactions are subject to review and approval by administrators.
                Processing times may vary depending on verification requirements.
                WalletPay reserves the right to reject any transaction that violates these terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Fees and Charges</h2>
              <p className="text-gray-600">
                Transaction fees may apply and will be displayed before completing transactions.
                Mobile network operator charges for USSD usage are the responsibility of the user.
                WalletPay reserves the right to modify fees with prior notice.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Security</h2>
              <p className="text-gray-600">
                You are responsible for keeping your account secure.
                Never share your password or PIN with anyone.
                Report any unauthorized transactions immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-600">
                WalletPay is not liable for any indirect, incidental, or consequential damages.
                Our maximum liability is limited to the amount in your wallet balance.
                We are not responsible for delays caused by mobile network operators.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Termination</h2>
              <p className="text-gray-600">
                We reserve the right to suspend or terminate accounts that violate these terms.
                You may close your account at any time by contacting support.
                Any remaining balance will be refunded after verification.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Changes to Terms</h2>
              <p className="text-gray-600">
                WalletPay may update these terms from time to time.
                Continued use of the service constitutes acceptance of updated terms.
                Significant changes will be notified via email.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Contact Information</h2>
              <p className="text-gray-600">
                For questions about these terms, contact us at support@walletpay.com
              </p>
            </section>
          </div>

          <div className="mt-8 text-center">
            <Link
              to="/register"
              className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Back to Registration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsAndConditions;