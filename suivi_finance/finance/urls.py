from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path('connexion/', views.login_view, name='login'),
    path('inscription/', views.register_view, name='register'),
    path('deconnexion/', views.logout_view, name='logout'),
    
    # App
    path('', views.dashboard, name='dashboard'),
    path('ajouter-revenu/', views.add_income, name='add_income'),
    path('ajouter-depense/', views.add_expense, name='add_expense'),
    path('supprimer-revenu/<int:pk>/', views.delete_income, name='delete_income'),
    path('supprimer-depense/<int:pk>/', views.delete_expense, name='delete_expense'),
]