# Hotel Luxury System - Testing Guide

This guide provides comprehensive testing procedures for all features of the Hotel Luxury Management System.

## 🧪 Testing Overview

### Test Categories
1. **Authentication & Authorization**
2. **Reservation Management**
3. **Check-in/Check-out Process**
4. **Payment Processing**
5. **Reporting & Analytics**
6. **Automated Tasks**
7. **Travel Company Features**
8. **Residential Suites**

## 👥 Test User Accounts

### Customer Accounts
- **Email**: `customer@hotel.com` | **Password**: `password`
- **Email**: `alice@hotel.com` | **Password**: `password` (Silver tier)
- **Email**: `bob@hotel.com` | **Password**: `password` (Gold tier)

### Staff Accounts
- **Email**: `clerk@hotel.com` | **Password**: `password`
- **Email**: `manager@hotel.com` | **Password**: `password`

### Travel Company Accounts
- **Email**: `sarah@luxurytours.com` | **Password**: `password`
- **Email**: `mike@globaltravel.com` | **Password**: `password`

## 🔐 Authentication & Authorization Tests

### Test 1: User Login
**Objective**: Verify all user types can log in successfully

**Steps**:
1. Navigate to `http://localhost:3000/login`
2. Test each user account above
3. Verify correct dashboard loads for each role

**Expected Results**:
- ✅ Customer login → Customer dashboard
- ✅ Clerk login → Clerk dashboard  
- ✅ Manager login → Manager dashboard
- ✅ Travel login → Travel dashboard

### Test 2: Role-based Access Control
**Objective**: Verify users can only access appropriate features

**Steps**:
1. Login as customer
2. Try to access clerk features (check-in, etc.)
3. Login as clerk
4. Try to access manager reports
5. Login as manager
6. Verify access to all features

**Expected Results**:
- ✅ Customers can only access reservation management
- ✅ Clerks can access check-in/check-out features
- ✅ Managers can access all features
- ✅ Travel companies can access bulk reservations

## 📋 Reservation Management Tests

### Test 3: Create Customer Reservation
**Objective**: Verify customers can create reservations

**Steps**:
1. Login as `customer@hotel.com`
2. Navigate to "Make Reservation"
3. Fill out reservation form:
   - Room Type: Standard
   - Check-in: Tomorrow
   - Check-out: Day after tomorrow
   - Guests: 2
   - Credit Card: Yes (enter test number)
4. Submit reservation

**Expected Results**:
- ✅ Reservation created successfully
- ✅ Status shows as "Pending"
- ✅ Reservation appears in customer dashboard

### Test 4: Create Travel Company Reservation
**Objective**: Verify travel companies can create bulk reservations

**Steps**:
1. Login as `sarah@luxurytours.com`
2. Navigate to "Make Reservation"
3. Fill out form for 3+ rooms
4. Submit reservation

**Expected Results**:
- ✅ Multiple reservations created
- ✅ Travel company discount applied
- ✅ Billing set to company account

### Test 5: Update Reservation
**Objective**: Verify reservation updates work

**Steps**:
1. Login as customer
2. Find existing reservation
3. Click "Edit"
4. Change check-out date
5. Save changes

**Expected Results**:
- ✅ Reservation updated successfully
- ✅ New check-out date reflected
- ✅ Price recalculated if needed

### Test 6: Cancel Reservation
**Objective**: Verify reservation cancellation

**Steps**:
1. Login as customer
2. Find pending reservation
3. Click "Cancel"
4. Confirm cancellation

**Expected Results**:
- ✅ Reservation status changes to "Cancelled"
- ✅ Reservation removed from active list

## 🏨 Check-in/Check-out Process Tests

### Test 7: Clerk Check-in Process
**Objective**: Verify clerk can check in guests

**Steps**:
1. Login as `clerk@hotel.com`
2. Navigate to "Pending Reservations"
3. Find a confirmed reservation
4. Click "Check In"
5. Select available room
6. Complete check-in

**Expected Results**:
- ✅ Guest status changes to "Checked-in"
- ✅ Room assigned successfully
- ✅ Room status changes to "Occupied"
- ✅ Guest appears in "Current Guests" list

### Test 8: Add Service Charges
**Objective**: Verify clerk can add service charges

**Steps**:
1. Login as clerk
2. Go to "Current Guests"
3. Find checked-in guest
4. Click "Add Charges"
5. Add restaurant charge: $50
6. Save charge

**Expected Results**:
- ✅ Service charge added successfully
- ✅ Charge appears in guest's bill
- ✅ Total outstanding balance updated

### Test 9: Check-out Process
**Objective**: Verify complete check-out process

**Steps**:
1. Login as clerk
2. Go to "Current Guests"
3. Find guest to check out
4. Click "Check Out"
5. Review final bill
6. Process payment (cash/credit card)
7. Complete check-out

**Expected Results**:
- ✅ Guest status changes to "Checked-out"
- ✅ Room status changes to "Cleaning"
- ✅ Payment processed successfully
- ✅ Final bill generated

### Test 10: Walk-in Reservation
**Objective**: Verify clerk can create walk-in reservations

**Steps**:
1. Login as clerk
2. Navigate to "Walk-in Reservation"
3. Fill out guest information
4. Select room type and dates
5. Create reservation
6. Check in immediately

**Expected Results**:
- ✅ Walk-in reservation created
- ✅ Guest checked in immediately
- ✅ Room assigned successfully

## 💳 Payment Processing Tests

### Test 11: Credit Card Payment
**Objective**: Verify credit card payment processing

**Steps**:
1. Create reservation with credit card
2. Enter test credit card number
3. Complete payment

**Expected Results**:
- ✅ Payment processed successfully
- ✅ Reservation status changes to "Confirmed"
- ✅ Payment record created

### Test 12: Cash Payment
**Objective**: Verify cash payment processing

**Steps**:
1. Login as clerk
2. Check out a guest
3. Select "Cash" payment method
4. Process payment

**Expected Results**:
- ✅ Cash payment recorded
- ✅ Check-out completed successfully
- ✅ Payment history updated

### Test 13: Travel Company Billing
**Objective**: Verify travel company billing

**Steps**:
1. Login as travel company
2. Create bulk reservation
3. Verify billing goes to company account
4. Check company credit limit

**Expected Results**:
- ✅ Billing charged to company
- ✅ Company balance updated
- ✅ Credit limit respected

### Test 14: Payment Refund
**Objective**: Verify refund processing

**Steps**:
1. Login as clerk
2. Find completed payment
3. Process refund
4. Verify refund record

**Expected Results**:
- ✅ Refund processed successfully
- ✅ Refund record created
- ✅ Original payment marked as refunded

## 📊 Reporting & Analytics Tests

### Test 15: Daily Reports
**Objective**: Verify daily report generation

**Steps**:
1. Login as manager
2. Navigate to "Reports"
3. Generate daily report
4. Review occupancy and revenue data

**Expected Results**:
- ✅ Report generated successfully
- ✅ Occupancy rate calculated correctly
- ✅ Revenue totals accurate
- ✅ Report downloadable

### Test 16: Occupancy Reports
**Objective**: Verify occupancy reporting

**Steps**:
1. Login as manager
2. Navigate to "Occupancy Reports"
3. Select date range
4. Generate report

**Expected Results**:
- ✅ Occupancy data displayed
- ✅ Charts and graphs render
- ✅ Data exportable

### Test 17: Financial Reports
**Objective**: Verify financial reporting

**Steps**:
1. Login as manager
2. Navigate to "Financial Reports"
3. Select reporting period
4. Generate report

**Expected Results**:
- ✅ Revenue data displayed
- ✅ Payment breakdown shown
- ✅ Outstanding balances listed
- ✅ Service charges included

## 🤖 Automated Tasks Tests

### Test 18: Auto-cancel Unpaid Reservations
**Objective**: Verify automatic cancellation of unpaid reservations

**Steps**:
1. Create reservation without credit card
2. Wait for 7 PM or manually trigger cron job
3. Check reservation status

**Expected Results**:
- ✅ Unpaid reservations cancelled
- ✅ Status changes to "Cancelled"
- ✅ Notification sent to customer

### Test 19: No-show Billing
**Objective**: Verify automatic billing for no-shows

**Steps**:
1. Create reservation for today
2. Don't check in the guest
3. Wait for 7 PM or manually trigger cron job
4. Check billing records

**Expected Results**:
- ✅ No-show fee billed
- ✅ Billing record created
- ✅ Reservation status changes to "No-show"

### Test 20: Daily Report Generation
**Objective**: Verify automatic daily report generation

**Steps**:
1. Wait for 7 PM or manually trigger cron job
2. Check daily reports table
3. Verify report data

**Expected Results**:
- ✅ Daily report generated
- ✅ Occupancy data recorded
- ✅ Revenue data recorded
- ✅ Statistics calculated correctly

## 🏢 Travel Company Tests

### Test 21: Bulk Reservation Creation
**Objective**: Verify travel companies can create multiple reservations

**Steps**:
1. Login as travel company
2. Create reservation for 3+ rooms
3. Verify all reservations created
4. Check company billing

**Expected Results**:
- ✅ Multiple reservations created
- ✅ Company discount applied
- ✅ Billing to company account
- ✅ Credit limit respected

### Test 22: Travel Company Credit Management
**Objective**: Verify credit limit enforcement

**Steps**:
1. Login as travel company
2. Create reservations until credit limit reached
3. Try to create additional reservation
4. Verify error message

**Expected Results**:
- ✅ Credit limit enforced
- ✅ Error message displayed
- ✅ No additional reservations created

## 🏠 Residential Suites Tests

### Test 23: Weekly Suite Booking
**Objective**: Verify weekly residential suite booking

**Steps**:
1. Login as customer
2. Select "Residential Suite"
3. Choose "Weekly" duration
4. Complete booking

**Expected Results**:
- ✅ Weekly rate applied
- ✅ Reservation created successfully
- ✅ Extended stay amenities listed

### Test 24: Monthly Suite Booking
**Objective**: Verify monthly residential suite booking

**Steps**:
1. Login as customer
2. Select "Residential Suite"
3. Choose "Monthly" duration
4. Complete booking

**Expected Results**:
- ✅ Monthly rate applied
- ✅ Reservation created successfully
- ✅ Extended stay features enabled

## 🔧 Manual Cron Job Testing

### Test 25: Manual Cron Job Execution
**Objective**: Test automated tasks manually

**Steps**:
1. Create test data (unpaid reservations, no-shows)
2. Execute cron job manually:
   ```bash
   curl -X POST http://localhost:3000/api/cron/daily-tasks \
     -H "Authorization: Bearer your-cron-secret-token"
   ```
3. Check results

**Expected Results**:
- ✅ Unpaid reservations cancelled
- ✅ No-show fees billed
- ✅ Daily report generated
- ✅ Success response received

## 📱 API Endpoint Tests

### Test 26: Reservation API
**Objective**: Test reservation API endpoints

**Steps**:
1. Test GET /api/reservations
2. Test POST /api/reservations
3. Test PUT /api/reservations
4. Test DELETE /api/reservations

**Expected Results**:
- ✅ All endpoints respond correctly
- ✅ Proper error handling
- ✅ Authentication required
- ✅ Role-based access control

### Test 27: Payment API
**Objective**: Test payment API endpoints

**Steps**:
1. Test payment processing
2. Test payment history
3. Test refund processing

**Expected Results**:
- ✅ Payments processed correctly
- ✅ History retrieved properly
- ✅ Refunds handled correctly

## 🐛 Error Handling Tests

### Test 28: Invalid Input Handling
**Objective**: Verify proper error handling

**Steps**:
1. Submit forms with invalid data
2. Try to access unauthorized features
3. Test with invalid dates
4. Test with invalid room selections

**Expected Results**:
- ✅ Proper error messages displayed
- ✅ Form validation working
- ✅ No system crashes
- ✅ User-friendly error messages

### Test 29: Database Error Handling
**Objective**: Verify database error handling

**Steps**:
1. Temporarily disconnect database
2. Try to perform operations
3. Reconnect database
4. Verify recovery

**Expected Results**:
- ✅ Graceful error handling
- ✅ User-friendly error messages
- ✅ System remains stable
- ✅ Recovery after reconnection

## 📊 Performance Tests

### Test 30: Load Testing
**Objective**: Verify system performance

**Steps**:
1. Create multiple reservations simultaneously
2. Process multiple check-ins
3. Generate multiple reports
4. Monitor system performance

**Expected Results**:
- ✅ System remains responsive
- ✅ No memory leaks
- ✅ Database queries optimized
- ✅ UI remains smooth

## ✅ Test Checklist

### Authentication & Authorization
- [ ] User login (all roles)
- [ ] Role-based access control
- [ ] Session management
- [ ] Logout functionality

### Reservation Management
- [ ] Create customer reservation
- [ ] Create travel company reservation
- [ ] Update reservation
- [ ] Cancel reservation
- [ ] View reservation history

### Check-in/Check-out
- [ ] Check-in process
- [ ] Room assignment
- [ ] Service charges
- [ ] Check-out process
- [ ] Walk-in reservations

### Payment Processing
- [ ] Credit card payments
- [ ] Cash payments
- [ ] Travel company billing
- [ ] Payment refunds
- [ ] Payment history

### Reporting
- [ ] Daily reports
- [ ] Occupancy reports
- [ ] Financial reports
- [ ] Export functionality

### Automated Tasks
- [ ] Auto-cancel unpaid reservations
- [ ] No-show billing
- [ ] Daily report generation
- [ ] Manual cron job execution

### Travel Company Features
- [ ] Bulk reservations
- [ ] Company billing
- [ ] Credit management
- [ ] Discount application

### Residential Suites
- [ ] Weekly bookings
- [ ] Monthly bookings
- [ ] Extended stay features

### API Testing
- [ ] All endpoints functional
- [ ] Proper authentication
- [ ] Error handling
- [ ] Response formats

### Error Handling
- [ ] Invalid input handling
- [ ] Database error handling
- [ ] Network error handling
- [ ] User-friendly messages

## 📝 Test Reporting

### Test Results Template
```
Test Name: [Test Name]
Date: [Date]
Tester: [Tester Name]
Status: [Pass/Fail]
Notes: [Any issues or observations]
```

### Bug Reporting
When bugs are found:
1. **Document the issue**: Describe what happened vs. what was expected
2. **Include steps to reproduce**: Detailed step-by-step instructions
3. **Add screenshots**: If applicable
4. **Note environment**: Browser, OS, etc.
5. **Report to development team**: Create issue in repository

## 🎯 Test Completion Criteria

A successful test run should have:
- ✅ All critical functionality working
- ✅ No major bugs or crashes
- ✅ Proper error handling
- ✅ Good user experience
- ✅ Performance acceptable
- ✅ Security measures working

---

**Remember**: This testing guide should be updated as new features are added or existing features are modified. 