# -*- coding: utf-8 -*-
"""
Pluggable reference validator.

The hardest-won lesson from the first book digitised with these tools:

    **Never trust an OCR engine's own confidence.**

Measured on a 796-page Arabic concordance, the engine returned 561 characters
of fabricated Chinese text for a *blank* page, and degenerate token loops that
scored 0.93 against completely unrelated content. Self-reported confidence was
uncorrelated with correctness in exactly the cases that mattered.

What worked instead was *external* validation: check each transcribed row
against a source of truth that the OCR engine had no access to, and keep only
what resolves. That moved usable output from ~80% to 96.3%.

That trick is only available when a book's content is independently known —
a Quranic concordance can be checked against the Quran; a dictionary of a known
edition can be checked against that edition. It is not always available, so it
is a *plugin*, not a hardcoded dependency.

Implement `ReferenceCorpus` for a book that has one, register it, and the
tooling will use it. Leave it unregistered and the tools that require one fail
loudly with an explanation rather than silently producing unvalidated output.

Example (Quranic concordance, lives in the Quran-corpus-visualizer repo):

    from ocr_py.reference import set_reference
    import validate_concordance as quran

    set_reference(quran)          # exposes split_rows() and resolve_row()
"""

from __future__ import annotations

from typing import Any, Protocol, runtime_checkable


@runtime_checkable
class ReferenceCorpus(Protocol):
    """What a book-specific validator must provide."""

    def split_rows(self, markdown: str) -> list[str]:
        """Split one page's OCR output into candidate rows."""
        ...

    def resolve_row(self, row: str, carry: Any = None) -> dict:
        """
        Try to match one row against the reference.

        Must return a dict carrying at least:
            status  -- "confirmed" | "weak" | "unresolved" | a rejection reason
            score   -- float, how strongly the row matched
        Anything else (resolved identifiers, corrected text) is book-specific
        and passed through untouched.
        """
        ...


_reference: Any = None


def set_reference(implementation: Any) -> None:
    """Register the validator for the book currently being processed."""
    global _reference
    for required in ("split_rows", "resolve_row"):
        if not hasattr(implementation, required):
            raise TypeError(
                f"reference implementation is missing {required}(); "
                "see ReferenceCorpus in this module"
            )
    _reference = implementation


def get_reference() -> Any:
    if _reference is None:
        raise RuntimeError(
            "No reference corpus registered.\n"
            "\n"
            "These tools refuse to score OCR output against nothing: an engine's\n"
            "self-reported confidence is not a substitute, and treating it as one\n"
            "is what lets hallucinated pages through.\n"
            "\n"
            "Register a validator for this book:\n"
            "    from ocr_py.reference import set_reference\n"
            "    set_reference(my_validator)   # needs split_rows() + resolve_row()\n"
            "\n"
            "If this book has no independently-known reference text, use the\n"
            "engine-comparison tools instead (build_compare_pdf.py) and review\n"
            "pages by eye — do not assume the output is correct."
        )
    return _reference


def has_reference() -> bool:
    return _reference is not None
