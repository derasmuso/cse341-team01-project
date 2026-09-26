/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

const createBookingDom = () => {
    document.body.innerHTML = `
        <div class="days-display">
            <label class="day-pill selected" for="day-0">
                <input
                    type="radio"
                    name="selectedDay"
                    id="day-0"
                    value="Tuesday"
                    checked
                >
                <span class="day-text">Tuesday</span>
            </label>

            <label class="day-pill" for="day-1">
                <input
                    type="radio"
                    name="selectedDay"
                    id="day-1"
                    value="Wednesday"
                >
                <span class="day-text">Wednesday</span>
            </label>
        </div>

        <div class="ticket-options">
            <label class="ticket-card" for="ticket-standard">
                <input
                    type="radio"
                    name="ticketClass"
                    id="ticket-standard"
                    value="standard"
                    data-name="standard"
                    data-price="8000"
                    checked
                >
                <span class="ticket-content">Standard</span>
            </label>

            <label class="ticket-card" for="ticket-premium">
                <input
                    type="radio"
                    name="ticketClass"
                    id="ticket-premium"
                    value="premium"
                    data-name="premium"
                    data-price="15000"
                >
                <span class="ticket-content">Premium</span>
            </label>

            <label class="ticket-card" for="ticket-first">
                <input
                    type="radio"
                    name="ticketClass"
                    id="ticket-first"
                    value="first"
                    data-name="first"
                    data-price="25000"
                >
                <span class="ticket-content">First</span>
            </label>
        </div>

        <div id="passengersList">
            <div class="passenger-card" data-passenger-index="0">
                <div class="passenger-card-header">
                    <h3 class="passenger-number">Passenger 1</h3>
                </div>
            </div>
        </div>

        <button id="addPassenger" type="button">
            Add Passenger
        </button>

        <button id="autofill" type="button">
            Autofill
        </button>

        <span id="selectedTicketName"></span>
        <span id="passengerCount"></span>
        <span id="pricePerTicket"></span>
        <span id="totalAmount"></span>
    `;
};

describe('Booking ticket availability', () => {
    beforeEach(() => {
        vi.resetModules();
        vi.restoreAllMocks();

        createBookingDom();
    });

    test('requests ticket classes when the selected day changes', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => [
                {
                    class: 'standard'
                }
            ]
        });

        vi.stubGlobal('fetch', fetchMock);

        await import('../../src/public/js/booking.js');

        const wednesday = document.querySelector(
            '#day-1'
        );

        wednesday.click();

        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        expect(fetchMock).toHaveBeenCalledWith(
            '/api/ticket-classes?day=wednesday'
        );
    });

    test('keeps available ticket classes enabled', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => [
                    {
                        class: 'standard'
                    },
                    {
                        class: 'premium'
                    }
                ]
            })
        );

        await import('../../src/public/js/booking.js');

        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        const standard = document.querySelector(
            '#ticket-standard'
        );

        const premium = document.querySelector(
            '#ticket-premium'
        );

        expect(standard.disabled).toBe(false);
        expect(premium.disabled).toBe(false);
    });

    test('disables unavailable ticket classes', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => [
                    {
                        class: 'standard'
                    }
                ]
            })
        );

        await import('../../src/public/js/booking.js');

        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        const premium = document.querySelector(
            '#ticket-premium'
        );

        const first = document.querySelector(
            '#ticket-first'
        );

        expect(premium.disabled).toBe(true);
        expect(first.disabled).toBe(true);
    });

    test('adds unavailable styling to unavailable ticket cards', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValue({
                ok: true,
                json: async () => [
                    {
                        class: 'standard'
                    }
                ]
            })
        );

        await import('../../src/public/js/booking.js');

        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        const premiumCard = document.querySelector(
            '#ticket-premium'
        ).closest('.ticket-card');

        const firstCard = document.querySelector(
            '#ticket-first'
        ).closest('.ticket-card');

        expect(
            premiumCard.classList.contains('unavailable')
        ).toBe(true);

        expect(
            firstCard.classList.contains('unavailable')
        ).toBe(true);
    });

    test('updates availability when the selected day changes', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    {
                        class: 'standard'
                    }
                ]
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => [
                    {
                        class: 'premium'
                    }
                ]
            });

        vi.stubGlobal('fetch', fetchMock);

        await import('../../src/public/js/booking.js');

        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        const wednesday = document.querySelector(
            '#day-1'
        );

        wednesday.click();

        await new Promise((resolve) => {
            setTimeout(resolve, 0);
        });

        const standard = document.querySelector(
            '#ticket-standard'
        );

        const premium = document.querySelector(
            '#ticket-premium'
        );

        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(standard.disabled).toBe(true);
        expect(premium.disabled).toBe(false);
    });

    test('handles API failures without breaking the booking page', async () => {
        const consoleError = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        vi.stubGlobal(
            'fetch',
            vi.fn().mockRejectedValue(
                new Error('API request failed')
            )
        );

        await expect(
            import('../../src/public/js/booking.js')
        ).resolves.toBeDefined();

        expect(consoleError).toHaveBeenCalled();

        consoleError.mockRestore();
    });
});