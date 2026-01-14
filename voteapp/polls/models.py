import uuid
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError

class Poll(models.Model):
    STATUS_CHOICES = [
        ("draft", "Draft"),
        ("scheduled", "Scheduled"),
        ("open", "Open"),
        ("closed", "Closed"),
    ]

    VOTING_MODE_CHOICES = [
        ("open", "Open voting"),
        ("restricted", "Restricted voting"),
    ]

    public_id = models.UUIDField(
        default=uuid.uuid4,  # callable, not uuid.uuid4()
        unique=True,
        editable=False
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="polls"
    )

    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()

    is_public = models.BooleanField(default=True)

    voting_mode = models.CharField(
        max_length=10,
        choices=VOTING_MODE_CHOICES,
        default="open"
    )

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default="draft"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def clean(self):
        if self.starts_at >= self.ends_at:
            raise ValidationError("Poll end time must be after start time")

    def compute_status(self):
        now = timezone.now()
        if self.starts_at <= now < self.ends_at:
            return "open"
        elif now >= self.ends_at:
            return "closed"
        else:
            return "scheduled"

    def update_status(self):
        new_status = self.compute_status()
        if new_status != self.status:
            self.status = new_status
            self.save(update_fields=["status"])

    def is_open(self):
        return self.compute_status() == "open"

class Choice(models.Model):
    poll = models.ForeignKey(
        Poll,
        on_delete=models.CASCADE,
        related_name="choices"
    )
    text = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.text} (Poll: {self.poll.title})"

class PollResult(models.Model):
    poll = models.OneToOneField(
        Poll,
        on_delete=models.CASCADE,
        related_name="result"
    )
    # { "choice_id": count }
    results = models.JSONField()
    total_votes = models.PositiveIntegerField()
    finalized_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Results for poll {self.poll.title}"
