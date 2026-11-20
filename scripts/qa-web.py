"""Browser acceptance test against a terminating, isolated static-file server."""
import os, sys, json, re, tempfile, pathlib, email
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial
from threading import Thread
from playwright.sync_api import sync_playwright
from email import policy

ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'.qa';OUT.mkdir(exist_ok=True)
class Quiet(SimpleHTTPRequestHandler):
    def log_message(self,*args): pass
server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=str(ROOT/'dist')))
Thread(target=server.serve_forever,daemon=True).start()
base='http://127.0.0.1:'+str(server.server_port)
errors=[]
with sync_playwright() as pw:
    browser=pw.chromium.launch(headless=True,args=['--no-sandbox'])
    context=browser.new_context(viewport={'width':1440,'height':950},accept_downloads=True)
    page=context.new_page();page.set_default_timeout(8000)
    page.on('pageerror',lambda err:errors.append(str(err)))
    def btn(label):
        dialog=page.get_by_role('dialog')
        root=dialog.last if dialog.count() and dialog.last.is_visible() else page
        return root.get_by_role('button',name=label,exact=True)
    def field(label):return page.get_by_label(label,exact=True)
    def click(label):btn(label).click()
    def fill(label,value):field(label).fill(value)
    def close():click('Fermer')
    def download(label,filename):
        with page.expect_download() as dl: click(label)
        path=OUT/filename;dl.value.save_as(path);return path
    try:
        page.goto(base,wait_until='networkidle');page.get_by_text('Bonjour Matthieu.',exact=True).wait_for();page.screenshot(path=str(OUT/'desktop-final.png'))
        click('Changer d’apparence');page.wait_for_timeout(240);page.screenshot(path=str(OUT/'light.png'));click('Changer d’apparence')
        page.keyboard.press('Control+k');fill('Un client, une prestation, un document…','chez julien');page.get_by_text('Soirée du Nouvel An',exact=True).last.wait_for();close()
        # The command input must prepare, not create, send, issue or collect.
        field('Une nouvelle prestation ?').fill('Studio Test, Paris, le 17 mars 2027, soirée privée, 1 000 €, acompte 30 %.');click('Préremplir la prestation')
        assert field('Nom ou entreprise').input_value()=='Studio Test'
        fill('Adresse postale','10 rue de démonstration, Paris');fill('E-mail','qa@example.invalid');click('Continuer')
        assert field('Date de la prestation').input_value()=='2027-03-17'
        fill('Nom de l’événement','Session de validation');fill('Nom du lieu','Salle des essais');fill('Adresse de l’événement','10 rue de démonstration, Paris');click('Continuer')
        assert field('Tarif de la prestation (€)').input_value()=='1000';assert field('Acompte (%)').input_value()=='30'
        click('Enregistrer et préparer le devis');page.get_by_text('ATELIER DOCUMENTAIRE',exact=True).wait_for()
        pdf=download('Télécharger le PDF','quote.pdf');assert pdf.read_bytes().startswith(b'%PDF-')
        click('Préparer l’e-mail');eml=download('Exporter le brouillon e-mail (.eml)','quote.eml');message=email.message_from_bytes(eml.read_bytes(),policy=policy.default);assert message['To']=='qa@example.invalid';assert list(message.iter_attachments())[0].get_payload(decode=True).startswith(b'%PDF-');click('Retour')
        click('Valider l’émission de démonstration');page.get_by_text('J’ai relu le PDF et je confirme',exact=False).click();click('Émettre l’exemple numéroté');page.get_by_text('DÉMO-DEV-2026-0012',exact=True).wait_for()
        click('Ouvrir la prestation');click('Documents');click('Facture d’acompte');page.get_by_text('ATELIER DOCUMENTAIRE',exact=True).wait_for();click('Valider l’émission de démonstration');page.get_by_text('J’ai relu le PDF et je confirme',exact=False).click();click('Émettre l’exemple numéroté');page.get_by_text('DÉMO-FAC-2026-0001',exact=True).wait_for()
        click('Confirmer le paiement');assert field('Montant reçu (€)').input_value()=='300';assert not btn('Confirmer le règlement reçu').is_enabled();page.get_by_text('Je confirme avoir reçu',exact=False).click();click('Confirmer le règlement reçu');page.get_by_text('Payé',exact=True).wait_for();close()
        click('Réglages');click('Accueil');page.get_by_text('Bonjour Matthieu.',exact=True).wait_for()
        page.reload(wait_until='networkidle');click('Documents');fill('Rechercher un document ou un numéro…','Studio Test');page.get_by_text('Facture d’acompte · Studio Test',exact=True).wait_for()
        click('Accueil');print('PASS — search, natural-language review, quote creation, PDF download, MIME e-mail attachment, invoice issue, explicit payment, demo reload.')
        # Actual private vault: activate, save, lock, reject a wrong password, unlock.
        activation=os.environ.get('MM_STUDIO_ACTIVATION');codefile=pathlib.Path('/tmp/mm-owner-activation')
        if not activation and codefile.exists():activation=codefile.read_text().strip()
        if activation:
            page.get_by_text('Ouvrir mon espace privé',exact=True).click();fill('Code d’initialisation du studio',activation);fill('Créer un mot de passe','QA-private-local-only-2026!');fill('Confirmer le mot de passe','QA-private-local-only-2026!');click('Créer mon coffre privé');page.get_by_text('ESPACE PRIVÉ',exact=True).wait_for()
            click('Clients');click('Nouveau client');fill('Nom ou entreprise','QA confidential client');fill('Adresse postale','Test local uniquement');click('Enregistrer le client');page.get_by_text('CARNET DE CLIENTS',exact=True).wait_for();close()
            page.reload(wait_until='networkidle');page.get_by_text('Déverrouiller le studio',exact=True).wait_for();assert 'QA confidential client' not in page.locator('body').inner_text();fill('Mot de passe','incorrect-test');click('Déverrouiller mon espace');page.get_by_text('Mot de passe incorrect ou sauvegarde illisible.',exact=True).wait_for();fill('Mot de passe','QA-private-local-only-2026!');click('Déverrouiller mon espace');page.get_by_text('ESPACE PRIVÉ',exact=True).wait_for();click('Clients');page.get_by_text('QA confidential client',exact=True).wait_for()
            click('Réglages');page.get_by_text('Données et sauvegardes',exact=True).click();backup=download('Exporter la sauvegarde chiffrée','backup.mmstudio');enc=backup.read_text();assert 'QA confidential client' not in enc and 'ciphertext' in json.loads(enc);close();print('PASS — protected provisioning, AES encrypted persistent vault, lock, bad-password rejection, unlock, encrypted backup.')
        mobile=browser.new_context(viewport={'width':393,'height':852},device_scale_factor=1,is_mobile=True,has_touch=True);mp=mobile.new_page();mp.on('pageerror',lambda exc:errors.append(str(exc)));mp.goto(base,wait_until='networkidle');mp.get_by_text('Bonjour Matthieu.',exact=True).wait_for();mp.screenshot(path=str(OUT/'iphone-final.png'));assert mp.evaluate('document.documentElement.scrollWidth')==393
        mp.get_by_role('tab',name='Clients',exact=True).click();mp.get_by_text('VOTRE RÉSEAU',exact=True).wait_for();mp.get_by_role('tab',name='Accueil',exact=True).click();mp.get_by_role('button',name='Nouvelle prestation',exact=True).click();mp.get_by_label('Nom ou entreprise',exact=True).fill('Test mobile');mp.get_by_role('button',name='Continuer',exact=True).click();mp.get_by_label('Nom de l’événement',exact=True).wait_for();mp.screenshot(path=str(OUT/'iphone-form.png'))
        mp.get_by_role('button',name='Fermer',exact=True).click();mp.evaluate('navigator.serviceWorker.ready');mobile.set_offline(True);mp.reload(wait_until='load');mp.get_by_text('Bonjour Matthieu.',exact=True).wait_for();print('PASS — iPhone navigation, responsive form, offline app shell.')
        assert not errors,errors;print('PASS — no JavaScript runtime errors.')
    except Exception as exc:
        page.screenshot(path=str(OUT/'failure.png'));print('QA stopped:',str(exc)[:1500]);raise
    finally:
        context.close();browser.close();server.shutdown()
