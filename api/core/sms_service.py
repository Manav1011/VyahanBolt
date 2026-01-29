import logging
from typing import Any, Tuple

import httpx

logger = logging.getLogger(__name__)

SMS_GATEWAY_URL = "https://sms-gateway.mnv-dev.site/send_sms"


def send_sms(to_number: str, message_body: str, timeout: int = 10) -> Tuple[bool, Any]:
    """
    Synchronous SMS send using `httpx.Client` as a drop-in replacement for `requests`.
    Returns (success, data_or_error).
    """
    try:
        with httpx.Client(timeout=timeout) as client:
            # Keep using `params` to match the existing gateway behavior.
            response = client.post(
                SMS_GATEWAY_URL,
                params={"to": to_number, "message": message_body},
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"SMS sent successfully to {to_number}: {data}")
            return True, data
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to send SMS to {to_number}: {str(e)}")
        try:
            if e.response is not None:
                logger.error(f"Gateway Response: {e.response.text}")
        except Exception:
            pass
        return False, str(e)
    except httpx.RequestError as e:
        logger.error(f"Failed to send SMS to {to_number}: {str(e)}")
        return False, str(e)


async def async_send_sms(to_number: str, message_body: str, timeout: int = 10) -> Tuple[bool, Any]:
    """
    Asynchronous SMS send using `httpx.AsyncClient`. Use this for concurrent/bulk sends
    or when running inside async Django/ASGI code paths.
    Returns (success, data_or_error).
    """
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                SMS_GATEWAY_URL,
                params={"to": to_number, "message": message_body},
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"Async SMS sent successfully to {to_number}: {data}")
            return True, data
    except httpx.HTTPStatusError as e:
        logger.error(f"Failed to send async SMS to {to_number}: {str(e)}")
        try:
            if e.response is not None:
                logger.error(f"Gateway Response: {e.response.text}")
        except Exception:
            pass
        return False, str(e)
    except httpx.RequestError as e:
        logger.error(f"Failed to send async SMS to {to_number}: {str(e)}")
        return False, str(e)
