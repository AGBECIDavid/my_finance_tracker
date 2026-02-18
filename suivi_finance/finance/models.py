from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone

class FinanceBase(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    amount = models.DecimalField("Montant (€)", max_digits=10, decimal_places=2)
    date = models.DateField("Date", default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True
        ordering = ['-date']

class Income(FinanceBase):
    source = models.CharField("Source du revenu", max_length=255)
    def __str__(self): return f"{self.source} ({self.amount}€)"

class Expense(FinanceBase):
    category = models.CharField("Motif / Description", max_length=255)
    def __str__(self): return f"{self.category} ({self.amount}€)"