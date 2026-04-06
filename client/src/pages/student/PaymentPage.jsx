import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ArrowLeft, Building2, CalendarDays, CreditCard, Landmark, ShieldCheck } from 'lucide-react';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { fetchBookingByIdAsync } from '../../features/bookings/bookingSlice';
import { createBookingPayment } from '../../features/payments/paymentAPI';

const onlyDigits = (value = '') => value.replace(/\D/g, '');

const formatCardNumber = (value = '') => onlyDigits(value).slice(0, 19).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (value = '') => {
    const raw = onlyDigits(value).slice(0, 4);
    if (raw.length <= 2) return raw;
    return `${raw.slice(0, 2)}/${raw.slice(2)}`;
};

const detectCardBrand = (cardNumber = '') => {
    const digits = onlyDigits(cardNumber);
    if (/^4/.test(digits)) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(digits)) return 'mastercard';
    if (/^3[47]/.test(digits)) return 'amex';
    return 'card';
};

const parseExpiry = (expiry = '') => {
    const [monthText, yearText] = expiry.split('/');
    const month = Number(monthText);
    const year = Number(yearText);

    if (!month || !year || month < 1 || month > 12) {
        return { valid: false };
    }

    const fullYear = yearText.length === 4 ? year : 2000 + year;
    const now = new Date();
    const expiryDate = new Date(fullYear, month, 0, 23, 59, 59, 999);
    const valid = expiryDate >= now;

    return { valid, month, fullYear };
};

const initialCardForm = {
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
    email: '',
    phone: '',
    amount: '',
};

const initialBankForm = {
    bankName: '',
    accountHolder: '',
    accountNumber: '',
    transferReference: '',
    transferDate: '',
    email: '',
    phone: '',
    amount: '',
};

const PaymentPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { selectedBooking, loading } = useSelector((state) => state.bookings);

    const [activeMethod, setActiveMethod] = useState('card');
    const [cardForm, setCardForm] = useState(initialCardForm);
    const [bankForm, setBankForm] = useState(initialBankForm);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        dispatch(fetchBookingByIdAsync(id));
    }, [dispatch, id]);

    useEffect(() => {
        if (!selectedBooking) return;
        const defaultAmount = String(selectedBooking.costSummary?.totalInitialPayment || 0);
        setCardForm((prev) => ({ ...prev, amount: prev.amount || defaultAmount }));
        setBankForm((prev) => ({ ...prev, amount: prev.amount || defaultAmount }));
    }, [selectedBooking]);

    const totalInitial = selectedBooking?.costSummary?.totalInitialPayment || 0;
    const outstanding = selectedBooking?.paymentStatus?.outstandingAmount ?? totalInitial;

    const title = useMemo(() => {
        if (!selectedBooking?.accommodation?.title) return 'Secure Payment';
        return `Pay for ${selectedBooking.accommodation.title}`;
    }, [selectedBooking]);

    const validateCommon = (form) => {
        const nextErrors = {};

        if (!form.email.trim()) {
            nextErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
            nextErrors.email = 'Enter a valid email address';
        }

        if (!form.phone.trim()) {
            nextErrors.phone = 'Phone number is required';
        } else if (!/^0\d{9}$/.test(form.phone.trim())) {
            nextErrors.phone = 'Phone number must be exactly 10 digits and start with 0';
        }

        const amount = Number(form.amount);
        if (!form.amount || Number.isNaN(amount)) {
            nextErrors.amount = 'Amount is required';
        } else if (amount <= 0) {
            nextErrors.amount = 'Amount must be greater than 0';
        } else if (amount > totalInitial) {
            nextErrors.amount = `Amount cannot exceed LKR ${totalInitial.toLocaleString()}`;
        }

        if (!acceptedTerms) {
            nextErrors.acceptedTerms = 'Please accept terms before making payment';
        }

        return nextErrors;
    };

    const validateCardForm = () => {
        const nextErrors = validateCommon(cardForm);

        if (!cardForm.cardholderName.trim()) {
            nextErrors.cardholderName = 'Cardholder name is required';
        } else if (cardForm.cardholderName.trim().length < 3) {
            nextErrors.cardholderName = 'Cardholder name should be at least 3 characters';
        }

        const cardDigits = onlyDigits(cardForm.cardNumber);
        if (!/^\d{13,19}$/.test(cardDigits)) {
            nextErrors.cardNumber = 'Card number is invalid';
        }

        const expiryResult = parseExpiry(cardForm.expiry);
        if (!expiryResult.valid) {
            nextErrors.expiry = 'Expiry must be in MM/YY format and must be a future date';
        }

        if (!/^\d{3,4}$/.test(cardForm.cvv)) {
            nextErrors.cvv = 'CVV must be 3 or 4 digits';
        }

        return nextErrors;
    };

    const validateBankForm = () => {
        const nextErrors = validateCommon(bankForm);

        if (!bankForm.bankName.trim()) {
            nextErrors.bankName = 'Bank name is required';
        }

        if (!bankForm.accountHolder.trim()) {
            nextErrors.accountHolder = 'Account holder name is required';
        }

        if (!/^\d{8,20}$/.test(bankForm.accountNumber)) {
            nextErrors.accountNumber = 'Account number must be 8 to 20 digits';
        }

        if (!/^[A-Za-z0-9\-_/]{6,30}$/.test(bankForm.transferReference.trim())) {
            nextErrors.transferReference = 'Transfer reference must be 6-30 characters';
        }

        if (!bankForm.transferDate) {
            nextErrors.transferDate = 'Transfer date is required';
        } else {
            const selectedDate = new Date(`${bankForm.transferDate}T23:59:59`);
            if (selectedDate > new Date()) {
                nextErrors.transferDate = 'Transfer date cannot be in the future';
            }
        }

        return nextErrors;
    };

    const handleCardSubmit = async (event) => {
        event.preventDefault();

        const validationErrors = validateCardForm();
        setErrors(validationErrors);
        if (Object.keys(validationErrors).length) return;

        setSubmitting(true);
        try {
            const amount = Number(cardForm.amount);
            const digits = onlyDigits(cardForm.cardNumber);

            await createBookingPayment(id, {
                paymentMethod: 'card',
                paymentType: 'booking_fee',
                amount,
                cardDetails: {
                    last4: digits.slice(-4),
                    brand: detectCardBrand(digits),
                },
                billingContact: {
                    email: cardForm.email.trim(),
                    phone: cardForm.phone.trim(),
                 },
             });
 
             toast.success('Card payment completed successfully');
             navigate(`/student/bookings/${id}`);
         } catch (error) {
             const message = error.response?.data?.message || 'Failed to process card payment';
             toast.error(message);
         } finally {
             setSubmitting(false);
         }
     };
 
     const handleBankSubmit = async (event) => {
         event.preventDefault();
 
         const validationErrors = validateBankForm();
         setErrors(validationErrors);
         if (Object.keys(validationErrors).length) return;
 
         setSubmitting(true);
         try {
             await createBookingPayment(id, {
                 paymentMethod: 'bank_transfer',
                 paymentType: 'booking_fee',
                 amount: Number(bankForm.amount),
                 bankTransfer: {
                     bankName: bankForm.bankName.trim(),
                     accountHolder: bankForm.accountHolder.trim(),
                     accountNumber: bankForm.accountNumber.trim(),
                     transferReference: bankForm.transferReference.trim(),
                     transferDate: bankForm.transferDate,
                 },
                 billingContact: {
                     email: bankForm.email.trim(),
                     phone: bankForm.phone.trim(),
                 },
             });
 
             toast.success('Bank transfer submitted for verification');
             navigate(`/student/bookings/${id}`);
         } catch (error) {
             const message = error.response?.data?.message || 'Failed to submit bank transfer';
             toast.error(message);
         } finally {
             setSubmitting(false);
         }
     };

    if (loading && !selectedBooking) {
        return <div className="mx-auto max-w-5xl px-4 py-10">Loading payment details...</div>;
    }

    if (!selectedBooking) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-10">
                <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">Booking not found.</p>
                <div className="mt-4">
                    <Button variant="outline" onClick={() => navigate('/student/bookings')}>
                        Back to My Bookings
                    </Button>
                </div>
            </div>
        );
    }

    const paymentBlocked = selectedBooking.status !== 'confirmed';

    return (
        <div className="mx-auto max-w-5xl px-4 py-8">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <Button variant="outline" onClick={() => navigate(`/student/bookings/${id}`)}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Booking
                </Button>
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                    <ShieldCheck className="h-4 w-4" /> Secure Checkout
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-lg">
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="mt-1 text-sm text-gray-600">Booking #{selectedBooking.bookingNumber}</p>

                    {paymentBlocked && (
                        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            Payment is currently available only for confirmed bookings.
                        </div>
                    )}

                    <div className="mt-5 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                setActiveMethod('card');
                                setErrors({});
                            }}
                            className={`rounded-xl border px-4 py-3 text-left transition ${
                                activeMethod === 'card'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-semibold">
                                <CreditCard className="h-4 w-4" /> Card Payment
                            </div>
                            <p className="mt-1 text-xs">Instant confirmation</p>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveMethod('bank_transfer');
                                setErrors({});
                            }}
                            className={`rounded-xl border px-4 py-3 text-left transition ${
                                activeMethod === 'bank_transfer'
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-semibold">
                                <Landmark className="h-4 w-4" /> Bank Transfer
                            </div>
                            <p className="mt-1 text-xs">Owner verification required</p>
                        </button>
                    </div>

                    {activeMethod === 'card' ? (
                        <form className="mt-5" onSubmit={handleCardSubmit} noValidate>
                            <Input
                                label="Cardholder Name"
                                name="cardholderName"
                                placeholder="Mandini Perera"
                                value={cardForm.cardholderName}
                                onChange={(e) => setCardForm((prev) => ({ ...prev, cardholderName: e.target.value }))}
                                error={errors.cardholderName}
                                required
                                disabled={paymentBlocked || submitting}
                            />

                            <Input
                                label="Card Number"
                                name="cardNumber"
                                placeholder="4242 4242 4242 4242"
                                value={cardForm.cardNumber}
                                onChange={(e) =>
                                    setCardForm((prev) => ({ ...prev, cardNumber: formatCardNumber(e.target.value) }))
                                }
                                error={errors.cardNumber}
                                required
                                disabled={paymentBlocked || submitting}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Expiry (MM/YY)"
                                    name="expiry"
                                    placeholder="08/29"
                                    value={cardForm.expiry}
                                    onChange={(e) =>
                                        setCardForm((prev) => ({ ...prev, expiry: formatExpiry(e.target.value) }))
                                    }
                                    error={errors.expiry}
                                    required
                                    disabled={paymentBlocked || submitting}
                                />
                                <Input
                                    label="CVV"
                                    name="cvv"
                                    placeholder="123"
                                    value={cardForm.cvv}
                                    onChange={(e) =>
                                        setCardForm((prev) => ({ ...prev, cvv: onlyDigits(e.target.value).slice(0, 4) }))
                                    }
                                    error={errors.cvv}
                                    required
                                    disabled={paymentBlocked || submitting}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={cardForm.email}
                                    onChange={(e) => setCardForm((prev) => ({ ...prev, email: e.target.value }))}
                                    error={errors.email}
                                    required
                                    disabled={paymentBlocked || submitting}
                                />
                                <Input
                                    label="Mobile Number"
                                    name="phone"
                                    placeholder="07XXXXXXXX"
                                    value={cardForm.phone}
                                    onChange={(e) =>
                                        setCardForm((prev) => ({ ...prev, phone: onlyDigits(e.target.value).slice(0, 10) }))
                                    }
                                    error={errors.phone}
                                    required
                                    disabled={paymentBlocked || submitting}
                                />
                            </div>

                            <Input
                                label="Amount (LKR)"
                                name="amount"
                                placeholder="0"
                                value={cardForm.amount}
                                onChange={(e) =>
                                    setCardForm((prev) => ({ ...prev, amount: onlyDigits(e.target.value).slice(0, 9) }))
                                }
                                error={errors.amount}
                                required
                                disabled={paymentBlocked || submitting}
                            />

                            <div className="mb-5 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
                                We never store full card details. Only masked card info is saved for transaction history.
                            </div>

                            <label className="mb-4 flex items-start gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    disabled={paymentBlocked || submitting}
                                    className="mt-1"
                                />
                                <span>
                                    I confirm these payment details are correct and authorize this transaction.
                                </span>
                            </label>
                            {errors.acceptedTerms && <p className="mb-4 text-sm text-red-600">{errors.acceptedTerms}</p>}

                            <Button
                                type="submit"
                                fullWidth
                                loading={submitting}
                                disabled={paymentBlocked || submitting}
                            >
                                Pay LKR {Number(cardForm.amount || 0).toLocaleString()} Now
                            </Button>
                        </form>
                    ) : (
                        <form className="mt-5" onSubmit={handleBankSubmit} noValidate>
                            <Input
                                label="Bank Name"
                                name="bankName"
                                placeholder="Bank of Ceylon"
                                value={bankForm.bankName}
                                onChange={(e) => setBankForm((prev) => ({ ...prev, bankName: e.target.value }))}
                                error={errors.bankName}
                                required
                                disabled={paymentBlocked || submitting}
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Account Holder"
                                    name="accountHolder"
                                    placeholder="Mandini Perera"
                                    value={bankForm.accountHolder}
                                    onChange={(e) => setBankForm((prev) => ({ ...prev, accountHolder: e.target.value }))}
                                    error={errors.accountHolder}
                                    required
                                    disabled={paymentBlocked || submitting}
                                />
                                <Input
                                    label="Account Number"
                                    name="accountNumber"
                                    placeholder="1234567890"
                                    value={bankForm.accountNumber}
                                    onChange={(e) =>
                                        setBankForm((prev) => ({ ...prev, accountNumber: onlyDigits(e.target.value).slice(0, 20) }))
                                    }
                                    error={errors.accountNumber}
                                    required
                                    disabled={paymentBlocked || submitting}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Transfer Reference"
                                    name="transferReference"
                                    placeholder="TRX-220193"
                                    value={bankForm.transferReference}
                                    onChange={(e) =>
                                        setBankForm((prev) => ({ ...prev, transferReference: e.target.value }))
                                    }
                                    error={errors.transferReference}
                                    required
                                    disabled={paymentBlocked || submitting}
                                />
                                <Input
                                    label="Transfer Date"
                                    name="transferDate"
                                    type="date"
                                    value={bankForm.transferDate}
                                    onChange={(e) => setBankForm((prev) => ({ ...prev, transferDate: e.target.value }))}
                                    error={errors.transferDate}
                                    required
                                    disabled={paymentBlocked || submitting}
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                    label="Email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={bankForm.email}
                                    onChange={(e) => setBankForm((prev) => ({ ...prev, email: e.target.value }))}
                                    error={errors.email}
                                    required
                                    disabled={paymentBlocked || submitting}
                                />
                                <Input
                                    label="Mobile Number"
                                    name="phone"
                                    placeholder="07XXXXXXXX"
                                    value={bankForm.phone}
                                    onChange={(e) =>
                                        setBankForm((prev) => ({ ...prev, phone: onlyDigits(e.target.value).slice(0, 10) }))
                                    }
                                    error={errors.phone}
                                    required
                                    disabled={paymentBlocked || submitting}
                                />
                            </div>

                            <Input
                                label="Amount (LKR)"
                                name="amount"
                                placeholder="0"
                                value={bankForm.amount}
                                onChange={(e) =>
                                    setBankForm((prev) => ({ ...prev, amount: onlyDigits(e.target.value).slice(0, 9) }))
                                }
                                error={errors.amount}
                                required
                                disabled={paymentBlocked || submitting}
                            />

                            <label className="mb-4 flex items-start gap-2 text-sm text-gray-700">
                                <input
                                    type="checkbox"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    disabled={paymentBlocked || submitting}
                                    className="mt-1"
                                />
                                <span>
                                    I confirm this transfer has been made and agree to manual verification by the owner.
                                </span>
                            </label>
                            {errors.acceptedTerms && <p className="mb-4 text-sm text-red-600">{errors.acceptedTerms}</p>}

                            <Button
                                type="submit"
                                fullWidth
                                loading={submitting}
                                disabled={paymentBlocked || submitting}
                            >
                                Submit Bank Transfer
                            </Button>
                        </form>
                    )}
                </div>

                <aside className="space-y-4">
                    <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-bold text-gray-900">Payment Summary</h2>
                        <div className="mt-4 space-y-2 text-sm text-gray-700">
                            <p className="flex justify-between"><span>Booking Number</span><span>{selectedBooking.bookingNumber}</span></p>
                            <p className="flex justify-between"><span>Status</span><span className="capitalize">{selectedBooking.status}</span></p>
                            <p className="flex justify-between"><span>Monthly Rent</span><span>LKR {(selectedBooking.costSummary?.monthlyRent || 0).toLocaleString()}</span></p>
                            <p className="flex justify-between"><span>Key Money</span><span>LKR {(selectedBooking.costSummary?.keyMoney || 0).toLocaleString()}</span></p>
                            <p className="flex justify-between"><span>Deposit</span><span>LKR {(selectedBooking.costSummary?.deposit || 0).toLocaleString()}</span></p>
                            <p className="flex justify-between border-t border-gray-200 pt-2 font-semibold text-blue-700">
                                <span>Total Initial Payment</span>
                                <span>LKR {totalInitial.toLocaleString()}</span>
                            </p>
                            <p className="flex justify-between font-semibold text-emerald-700">
                                <span>Outstanding</span>
                                <span>LKR {Number(outstanding || 0).toLocaleString()}</span>
                            </p>
                        </div>
                    </div>

                    <div className="rounded-2xl border-2 border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-base font-bold text-gray-900">Booking Information</h3>
                        <div className="mt-3 space-y-2 text-sm text-gray-700">
                            <p className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-blue-600" /> {selectedBooking.accommodation?.title || '-'}
                            </p>
                            <p className="flex items-center gap-2">
                                <CalendarDays className="h-4 w-4 text-blue-600" />
                                Check-in: {selectedBooking.checkInDate ? new Date(selectedBooking.checkInDate).toLocaleDateString() : '-'}
                            </p>
                            <p className="capitalize">Room Type: {selectedBooking.roomType || '-'}</p>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default PaymentPage;
